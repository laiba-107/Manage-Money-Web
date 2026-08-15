import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...dto,
      userId,
      date: new Date(dto.date),
    });

    const saved = await this.transactionRepository.save(transaction);

    if (dto.isRecurring && dto.recurrenceInterval) {
      await this.createRecurringTransactions(saved);
    }

    return saved;
  }

  async findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResult<Transaction>> {
    const {
      type, categoryId, startDate, endDate, search,
      page = 1, limit = 20, sortBy = 'date', sortOrder = 'DESC', tag,
    } = query;

    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId });

    if (type) qb.andWhere('t.type = :type', { type });
    if (categoryId) qb.andWhere('t.categoryId = :categoryId', { categoryId });
    if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('t.date <= :endDate', { endDate });
    if (search) {
      qb.andWhere('(t.title ILIKE :search OR t.notes ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (tag) qb.andWhere(':tag = ANY(t.tags)', { tag });

    const allowedSortFields = ['date', 'amount', 'title', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    qb.orderBy(`t.${safeSortBy}`, sortOrder);

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(userId, id);

    // Remove existing category relation object so categoryId changes take effect cleanly in TypeORM
    delete (transaction as any).category;

    let targetCategoryId = dto.categoryId;

    if (!targetCategoryId && dto.title) {
      const cat = await this.transactionRepository.manager.findOne('categories', {
        where: [
          { name: dto.title },
          { name: dto.title, type: dto.type || transaction.type },
        ],
      });
      if (cat) {
        targetCategoryId = (cat as any).id;
      }
    }

    Object.assign(transaction, {
      ...dto,
      categoryId: targetCategoryId || transaction.categoryId,
      date: dto.date ? new Date(dto.date) : transaction.date,
    });

    await this.transactionRepository.save(transaction);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.findOne(userId, id);
    await this.transactionRepository.remove(transaction);
  }

  async getSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ income: number; expenses: number; balance: number }> {
    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('t.type')
      .getRawMany();

    const income =
      parseFloat(
        result.find((r) => r.type === TransactionType.INCOME)?.total || '0',
      );
    const expenses =
      parseFloat(
        result.find((r) => r.type === TransactionType.EXPENSE)?.total || '0',
      );

    return { income, expenses, balance: income - expenses };
  }

  async getCategorySpending(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.transactionRepository
      .createQueryBuilder('t')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.icon', 'icon')
      .addSelect('c.color', 'color')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(t.id)', 'count')
      .leftJoin('t.category', 'c')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('c.id, c.name, c.icon, c.color')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async getDailyTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.transactionRepository
      .createQueryBuilder('t')
      .select('DATE(t.date)', 'date')
      .addSelect('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(t.date), t.type')
      .orderBy('DATE(t.date)', 'ASC')
      .getRawMany();
  }

  private async createRecurringTransactions(
    parent: Transaction,
  ): Promise<void> {
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

    const recurring = dates.map((date) =>
      this.transactionRepository.create({
        amount: parent.amount,
        type: parent.type,
        title: parent.title,
        notes: parent.notes,
        date,
        categoryId: parent.categoryId,
        userId: parent.userId,
        paymentMethod: parent.paymentMethod,
        currency: parent.currency,
        tags: parent.tags,
        isRecurring: true,
        recurrenceInterval: parent.recurrenceInterval,
        recurrenceParentId: parent.id,
      }),
    );

    await this.transactionRepository.save(recurring);
  }

  private getNextDate(date: Date, interval: RecurrenceInterval): Date {
    switch (interval) {
      case RecurrenceInterval.DAILY:
        return addDays(date, 1);
      case RecurrenceInterval.WEEKLY:
        return addWeeks(date, 1);
      case RecurrenceInterval.BIWEEKLY:
        return addWeeks(date, 2);
      case RecurrenceInterval.MONTHLY:
        return addMonths(date, 1);
      case RecurrenceInterval.QUARTERLY:
        return addMonths(date, 3);
      case RecurrenceInterval.YEARLY:
        return addYears(date, 1);
      default:
        return addMonths(date, 1);
    }
  }
}
