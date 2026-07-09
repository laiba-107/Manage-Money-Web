import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    private transactionsService: TransactionsService,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const budget = this.budgetRepository.create({ ...dto, userId });
    if (dto.startDate) budget.startDate = new Date(dto.startDate);
    if (dto.endDate) budget.endDate = new Date(dto.endDate);
    return this.budgetRepository.save(budget);
  }

  async findAll(userId: string): Promise<BudgetWithUsage[]> {
    const budgets = await this.budgetRepository.find({
      where: { userId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
  }

  async findOne(userId: string, id: string): Promise<BudgetWithUsage> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.enrichWithUsage(budget);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    Object.assign(budget, dto);
    if (dto.startDate) budget.startDate = new Date(dto.startDate);
    if (dto.endDate) budget.endDate = new Date(dto.endDate);
    return this.budgetRepository.save(budget);
  }

  async remove(userId: string, id: string): Promise<void> {
    const budget = await this.budgetRepository.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.budgetRepository.remove(budget);
  }

  async getMonthlyBudgetStatus(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<BudgetWithUsage[]> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const budgets = await this.budgetRepository.find({
      where: [
        { userId, month: targetMonth, year: targetYear, isActive: true },
        { userId, month: null, year: null, isActive: true },
      ],
      relations: ['category'],
    });

    return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
  }

  private async enrichWithUsage(budget: Budget): Promise<BudgetWithUsage> {
    const { startDate, endDate } = this.getBudgetDateRange(budget);
    const spent = await this.getSpentAmount(budget, startDate, endDate);
    const remaining = Math.max(0, budget.amount - spent);
    const percentageUsed = (spent / budget.amount) * 100;

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
    const query = this.budgetRepository.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .from('transactions', 't')
      .where('t.userId = :userId', { userId: budget.userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (budget.categoryId) {
      query.andWhere('t.categoryId = :categoryId', {
        categoryId: budget.categoryId,
      });
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  }
}
