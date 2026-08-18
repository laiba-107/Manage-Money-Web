import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Budget, BudgetPeriod } from './entities/budget.entity';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { startOfMonth, endOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly firebase: FirebaseService,
    private transactionsService: TransactionsService,
  ) {}

  private col() {
    return this.firebase.collection('budgets');
  }

  private docToBudget(id: string, data: FirebaseFirestore.DocumentData): Budget {
    return {
      id,
      userId: data.userId,
      name: data.name,
      amount: Number(data.amount),
      period: data.period ?? BudgetPeriod.MONTHLY,
      month: data.month,
      year: data.year,
      startDate: data.startDate?.toDate?.(),
      endDate: data.endDate?.toDate?.(),
      isActive: data.isActive ?? true,
      alertThreshold: data.alertThreshold ?? 80,
      alertSent: data.alertSent ?? false,
      categoryId: data.categoryId,
      category: data.category,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const id = uuidv4();
    const now = new Date();
    const budget: Budget = {
      id,
      userId,
      name: dto.name,
      amount: Number(dto.amount),
      period: dto.period ?? BudgetPeriod.MONTHLY,
      month: dto.month,
      year: dto.year,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: true,
      alertThreshold: dto.alertThreshold ?? 80,
      alertSent: false,
      categoryId: dto.categoryId,
      createdAt: now,
      updatedAt: now,
    };

    await this.col().doc(id).set(this.firebase.clean(budget));
    return budget;
  }

  async findAll(userId: string): Promise<BudgetWithUsage[]> {
    const snap = await this.col()
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const budgets = snap.docs.map((d) => this.docToBudget(d.id, d.data()));
    // Sort by createdAt DESC
    budgets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
  }

  async findOne(userId: string, id: string): Promise<BudgetWithUsage> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Budget not found');
    const budget = this.docToBudget(doc.id, doc.data()!);
    if (budget.userId !== userId) throw new NotFoundException('Budget not found');
    return this.enrichWithUsage(budget);
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto): Promise<Budget> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Budget not found');
    const budget = this.docToBudget(doc.id, doc.data()!);
    if (budget.userId !== userId) throw new NotFoundException('Budget not found');

    const updates: Partial<Budget> = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : budget.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : budget.endDate,
      updatedAt: new Date(),
    };
    await this.col().doc(id).update(this.firebase.clean(updates));
    return { ...budget, ...updates };
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Budget not found');
    const budget = this.docToBudget(doc.id, doc.data()!);
    if (budget.userId !== userId) throw new NotFoundException('Budget not found');
    await this.col().doc(id).delete();
  }

  async getMonthlyBudgetStatus(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<BudgetWithUsage[]> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const snap = await this.col()
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const budgets = snap.docs
      .map((d) => this.docToBudget(d.id, d.data()))
      .filter((b) => {
        if (!b.month && !b.year) return true; // no month/year filter = always included
        return b.month === targetMonth && b.year === targetYear;
      });

    return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
  }

  private async enrichWithUsage(budget: Budget): Promise<BudgetWithUsage> {
    const { startDate, endDate } = this.getBudgetDateRange(budget);
    const spent = await this.getSpentAmount(budget, startDate, endDate);
    const remaining = Math.max(0, budget.amount - spent);
    const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      spent,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      isOverBudget: spent > budget.amount,
    };
  }

  private getBudgetDateRange(budget: Budget): { startDate: Date; endDate: Date } {
    if (budget.startDate && budget.endDate) {
      return { startDate: budget.startDate, endDate: budget.endDate };
    }
    const now = new Date();
    if (budget.month && budget.year) {
      const date = new Date(budget.year, budget.month - 1, 1);
      return { startDate: startOfMonth(date), endDate: endOfMonth(date) };
    }
    return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }

  private async getSpentAmount(
    budget: Budget,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const transactions = await this.transactionsService.getAllForUser(budget.userId);
    return transactions
      .filter(
        (t) =>
          t.type === TransactionType.EXPENSE &&
          t.date >= startDate &&
          t.date <= endDate &&
          (!budget.categoryId || t.categoryId === budget.categoryId),
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }
}
