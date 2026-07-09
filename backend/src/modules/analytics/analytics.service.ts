import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  format, subMonths, subWeeks, subYears,
} from 'date-fns';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private transactionsService: TransactionsService,
  ) {}

  async getDashboardData(userId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [currentMonth, lastMonth, recentTransactions, categorySpending] =
      await Promise.all([
        this.transactionsService.getSummary(userId, monthStart, monthEnd),
        this.transactionsService.getSummary(userId, lastMonthStart, lastMonthEnd),
        this.getRecentTransactions(userId, 5),
        this.transactionsService.getCategorySpending(userId, monthStart, monthEnd),
      ]);

    const totalBalance = await this.getTotalBalance(userId);

    const incomeChange = this.getPercentageChange(
      lastMonth.income,
      currentMonth.income,
    );
    const expenseChange = this.getPercentageChange(
      lastMonth.expenses,
      currentMonth.expenses,
    );

    return {
      totalBalance,
      currentMonth,
      lastMonth,
      incomeChange,
      expenseChange,
      recentTransactions,
      categorySpending: categorySpending.slice(0, 5),
      savingsRate:
        currentMonth.income > 0
          ? ((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100
          : 0,
    };
  }

  async getReport(userId: string, period: ReportPeriod, date?: Date) {
    const now = date || new Date();
    const { startDate, endDate, intervals, formatFn } =
      this.getPeriodConfig(period, now);

    const dailyTotals = await this.transactionsService.getDailyTotals(
      userId,
      startDate,
      endDate,
    );

    const chartData = this.buildChartData(intervals, dailyTotals, formatFn);
    const summary = await this.transactionsService.getSummary(
      userId,
      startDate,
      endDate,
    );
    const categorySpending = await this.transactionsService.getCategorySpending(
      userId,
      startDate,
      endDate,
    );

    return {
      period,
      startDate,
      endDate,
      summary,
      chartData,
      categorySpending,
      topCategories: categorySpending.slice(0, 5),
    };
  }

  async getSpendingTrends(userId: string, months: number = 6) {
    const now = new Date();
    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const summary = await this.transactionsService.getSummary(userId, start, end);
      trends.push({
        month: format(date, 'MMM yyyy'),
        ...summary,
        savings: summary.income - summary.expenses,
      });
    }

    return trends;
  }

  async getInsights(userId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [currentMonth, lastMonth, topCategories] = await Promise.all([
      this.transactionsService.getSummary(userId, monthStart, monthEnd),
      this.transactionsService.getSummary(userId, lastMonthStart, lastMonthEnd),
      this.transactionsService.getCategorySpending(userId, monthStart, monthEnd),
    ]);

    const insights = [];

    // Spending increase insight
    if (currentMonth.expenses > lastMonth.expenses * 1.1) {
      const increase = (
        ((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) *
        100
      ).toFixed(1);
      insights.push({
        type: 'warning',
        title: 'Spending Increase',
        message: `Your spending is ${increase}% higher than last month`,
        icon: 'trending_up',
      });
    }

    // Savings insight
    if (currentMonth.income > 0) {
      const savingsRate =
        ((currentMonth.income - currentMonth.expenses) / currentMonth.income) *
        100;
      if (savingsRate >= 20) {
        insights.push({
          type: 'success',
          title: 'Great Savings Rate',
          message: `You're saving ${savingsRate.toFixed(1)}% of your income this month`,
          icon: 'savings',
        });
      } else if (savingsRate < 0) {
        insights.push({
          type: 'danger',
          title: 'Over Budget',
          message: `You've spent ${Math.abs(savingsRate).toFixed(1)}% more than you earned`,
          icon: 'warning',
        });
      }
    }

    // Top spending category
    if (topCategories.length > 0) {
      const top = topCategories[0];
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        message: `${top.categoryName} is your biggest expense at $${parseFloat(top.total).toFixed(2)}`,
        icon: 'category',
      });
    }

    return insights;
  }

  private async getTotalBalance(userId: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select(
        `SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)`,
        'balance',
      )
      .where('t.userId = :userId', { userId })
      .getRawOne();

    return parseFloat(result?.balance || '0');
  }

  private async getRecentTransactions(userId: string, limit: number) {
    return this.transactionRepository.find({
      where: { userId },
      relations: ['category'],
      order: { date: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  private getPeriodConfig(period: ReportPeriod, now: Date) {
    switch (period) {
      case 'daily':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          intervals: eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }),
          formatFn: (d: Date) => format(d, 'MMM dd'),
        };
      case 'weekly':
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now),
          intervals: eachWeekOfInterval({ start: startOfYear(now), end: endOfYear(now) }),
          formatFn: (d: Date) => `W${format(d, 'ww')}`,
        };
      case 'monthly':
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now),
          intervals: eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) }),
          formatFn: (d: Date) => format(d, 'MMM'),
        };
      case 'yearly':
        const yearStart = subYears(now, 4);
        return {
          startDate: startOfYear(yearStart),
          endDate: endOfYear(now),
          intervals: Array.from({ length: 5 }, (_, i) =>
            new Date(yearStart.getFullYear() + i, 0, 1),
          ),
          formatFn: (d: Date) => format(d, 'yyyy'),
        };
      default:
        throw new Error('Invalid period');
    }
  }

  private buildChartData(intervals: Date[], dailyTotals: any[], formatFn: Function) {
    return intervals.map((interval) => {
      const label = formatFn(interval);
      const dayStr = format(interval, 'yyyy-MM-dd');

      const income = dailyTotals
        .filter((d) => d.date?.toString()?.startsWith(dayStr.substring(0, 7)))
        .filter((d) => d.type === TransactionType.INCOME)
        .reduce((sum, d) => sum + parseFloat(d.total), 0);

      const expenses = dailyTotals
        .filter((d) => d.date?.toString()?.startsWith(dayStr.substring(0, 7)))
        .filter((d) => d.type === TransactionType.EXPENSE)
        .reduce((sum, d) => sum + parseFloat(d.total), 0);

      return { label, income, expenses, savings: income - expenses };
    });
  }

  private getPercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
  }
}
