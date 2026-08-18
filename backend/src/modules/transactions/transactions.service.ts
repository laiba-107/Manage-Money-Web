import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  Transaction,
  TransactionType,
  RecurrenceInterval,
} from './entities/transaction.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { addDays, addWeeks, addMonths, addYears, isBefore } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.collection('transactions');
  }

  private docToTransaction(
    id: string,
    data: FirebaseFirestore.DocumentData,
  ): Transaction {
    return {
      id,
      userId: data.userId,
      amount: Number(data.amount),
      type: data.type,
      title: data.title,
      notes: data.notes || '',
      date: data.date?.toDate?.() ?? new Date(data.date),
      paymentMethod: data.paymentMethod,
      receiptUrl: data.receiptUrl,
      isRecurring: data.isRecurring ?? false,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceEndDate: data.recurrenceEndDate?.toDate?.(),
      recurrenceParentId: data.recurrenceParentId,
      currency: data.currency ?? 'USD',
      exchangeRate: Number(data.exchangeRate ?? 1),
      tags: data.tags ?? [],
      categoryId: data.categoryId,
      category: data.category,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date();

    let categoryData: any = undefined;
    if (dto.categoryId) {
      try {
        const catDoc = await this.firebase.collection('categories').doc(dto.categoryId).get();
        if (catDoc.exists) {
          const c = catDoc.data()!;
          categoryData = { id: catDoc.id, name: c.name, icon: c.icon, color: c.color };
        }
      } catch (_) {}
    }

    const tx: Transaction = {
      id,
      userId,
      amount: Number(dto.amount),
      type: dto.type,
      title: dto.title,
      notes: dto.notes,
      date: new Date(dto.date),
      paymentMethod: dto.paymentMethod,
      isRecurring: dto.isRecurring ?? false,
      recurrenceInterval: dto.recurrenceInterval,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
      currency: dto.currency ?? 'USD',
      exchangeRate: 1,
      tags: dto.tags ?? [],
      categoryId: dto.categoryId,
      category: categoryData,
      createdAt: now,
      updatedAt: now,
    };

    await this.col().doc(id).set(this.firebase.clean(tx));

    if (dto.isRecurring && dto.recurrenceInterval) {
      await this.createRecurringTransactions(tx);
    }

    return tx;
  }

  async findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResult<Transaction>> {
    const {
      type, categoryId, startDate, endDate, search,
      page = 1, limit = 20, sortBy = 'date', sortOrder = 'DESC', tag,
    } = query;

    let q: FirebaseFirestore.Query = this.col().where('userId', '==', userId);

    if (type) q = q.where('type', '==', type);
    if (categoryId) q = q.where('categoryId', '==', categoryId);

    const snap = await q.get();
    let transactions = snap.docs.map((d) => this.docToTransaction(d.id, d.data()));

    // In-memory filters
    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter((t) => t.date >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      transactions = transactions.filter((t) => t.date <= end);
    }
    if (search) {
      const s = search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          (t.notes && t.notes.toLowerCase().includes(s)),
      );
    }
    if (tag) {
      transactions = transactions.filter((t) => t.tags?.includes(tag));
    }

    // Sorting
    const allowedSort = ['date', 'amount', 'title', 'createdAt'];
    const sf = allowedSort.includes(sortBy) ? (sortBy as keyof Transaction) : 'date';
    transactions.sort((a, b) => {
      const av = a[sf] as any;
      const bv = b[sf] as any;
      if (av < bv) return sortOrder === 'ASC' ? -1 : 1;
      if (av > bv) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    const total = transactions.length;
    const data = transactions.slice((page - 1) * limit, page * limit);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) throw new NotFoundException('Transaction not found');
    const tx = this.docToTransaction(doc.id, doc.data()!);
    if (tx.userId !== userId) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const tx = await this.findOne(userId, id);

    let categoryData = tx.category;
    if (dto.categoryId && dto.categoryId !== tx.categoryId) {
      try {
        const catDoc = await this.firebase.collection('categories').doc(dto.categoryId).get();
        if (catDoc.exists) {
          const c = catDoc.data()!;
          categoryData = { id: catDoc.id, name: c.name, icon: c.icon, color: c.color };
        }
      } catch (_) {}
    }

    const updates: Partial<Transaction> = {
      ...dto,
      date: dto.date ? new Date(dto.date) : tx.date,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : tx.recurrenceEndDate,
      category: categoryData,
      updatedAt: new Date(),
    };

    await this.col().doc(id).update(this.firebase.clean(updates));
    return { ...tx, ...updates };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.col().doc(id).delete();
  }

  async getSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ income: number; expenses: number; balance: number }> {
    const snap = await this.col().where('userId', '==', userId).get();
    let income = 0;
    let expenses = 0;

    snap.docs.forEach((d) => {
      const tx = this.docToTransaction(d.id, d.data());
      if (tx.date >= startDate && tx.date <= endDate) {
        if (tx.type === TransactionType.INCOME) income += tx.amount;
        else expenses += tx.amount;
      }
    });

    return { income, expenses, balance: income - expenses };
  }

  async getCategorySpending(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const snap = await this.col()
      .where('userId', '==', userId)
      .where('type', '==', TransactionType.EXPENSE)
      .get();

    // Cache categories lookup
    const catSnap = await this.firebase.collection('categories').get();
    const catMap = new Map<string, { name: string; icon: string; color: string }>();
    catSnap.docs.forEach((d) => {
      const data = d.data();
      catMap.set(d.id, { name: data.name, icon: data.icon, color: data.color });
    });

    const map = new Map<string, { categoryId: string; categoryName: string; icon: string; color: string; total: number; count: number }>();

    snap.docs.forEach((d) => {
      const tx = this.docToTransaction(d.id, d.data());
      if (tx.date < startDate || tx.date > endDate) return;

      const key = tx.categoryId ?? 'uncategorized';
      const catInfo = (tx.categoryId && catMap.get(tx.categoryId)) || tx.category;

      const existing = map.get(key);
      if (existing) {
        existing.total += tx.amount;
        existing.count += 1;
      } else {
        map.set(key, {
          categoryId: key,
          categoryName: catInfo?.name ?? 'Other',
          icon: catInfo?.icon ?? 'category',
          color: catInfo?.color ?? '#9E9E9E',
          total: tx.amount,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  async getDailyTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const snap = await this.col().where('userId', '==', userId).get();
    const map = new Map<string, { date: string; type: string; total: number }>();

    snap.docs.forEach((d) => {
      const tx = this.docToTransaction(d.id, d.data());
      if (tx.date < startDate || tx.date > endDate) return;

      const dateStr = tx.date.toISOString().split('T')[0];
      const key = `${dateStr}_${tx.type}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += tx.amount;
      } else {
        map.set(key, { date: dateStr, type: tx.type, total: tx.amount });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAllForUser(userId: string): Promise<Transaction[]> {
    const snap = await this.col().where('userId', '==', userId).get();
    return snap.docs.map((d) => this.docToTransaction(d.id, d.data()));
  }

  private async createRecurringTransactions(parent: Transaction): Promise<void> {
    if (!parent.recurrenceInterval) return;

    const endDate = parent.recurrenceEndDate
      ? new Date(parent.recurrenceEndDate)
      : addYears(new Date(parent.date), 1);

    const dates: Date[] = [];
    let current = new Date(parent.date);

    while (isBefore(current, endDate) && dates.length < 365) {
      current = this.getNextDate(current, parent.recurrenceInterval);
      if (isBefore(current, endDate)) {
        dates.push(new Date(current));
      }
    }

    const now = new Date();
    const batch = this.firebase.firestore().batch();

    dates.forEach((date) => {
      const id = uuidv4();
      const ref = this.col().doc(id);
      const tx: Transaction = {
        id,
        userId: parent.userId,
        amount: parent.amount,
        type: parent.type,
        title: parent.title,
        notes: parent.notes,
        date,
        categoryId: parent.categoryId,
        category: parent.category,
        paymentMethod: parent.paymentMethod,
        currency: parent.currency,
        tags: parent.tags,
        isRecurring: true,
        recurrenceInterval: parent.recurrenceInterval,
        recurrenceParentId: parent.id,
        exchangeRate: parent.exchangeRate,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(ref, this.firebase.clean(tx));
    });

    await batch.commit();
  }

  private getNextDate(date: Date, interval: RecurrenceInterval): Date {
    switch (interval) {
      case RecurrenceInterval.DAILY: return addDays(date, 1);
      case RecurrenceInterval.WEEKLY: return addWeeks(date, 1);
      case RecurrenceInterval.BIWEEKLY: return addWeeks(date, 2);
      case RecurrenceInterval.MONTHLY: return addMonths(date, 1);
      case RecurrenceInterval.QUARTERLY: return addMonths(date, 3);
      case RecurrenceInterval.YEARLY: return addYears(date, 1);
      default: return addMonths(date, 1);
    }
  }
}
