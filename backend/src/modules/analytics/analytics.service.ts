import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  format, subMonths, subYears,
} from 'date-fns';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

@Injectable()
export class AnalyticsService {
  constructor(private transactionsService: TransactionsService) {}

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

    return {
      totalBalance,
      currentMonth,
      lastMonth,
      incomeChange: this.getPercentageChange(lastMonth.income, currentMonth.income),
      expenseChange: this.getPercentageChange(lastMonth.expenses, currentMonth.expenses),
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
    const { startDate, endDate, intervals, formatFn } = this.getPeriodConfig(period, now);

    const [dailyTotals, summary, categorySpending] = await Promise.all([
      this.transactionsService.getDailyTotals(userId, startDate, endDate),
      this.transactionsService.getSummary(userId, startDate, endDate),
      this.transactionsService.getCategorySpending(userId, startDate, endDate),
    ]);

    const chartData = this.buildChartData(intervals, dailyTotals, formatFn);

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

    const insights: any[] = [];

    if (lastMonth.expenses > 0 && currentMonth.expenses > lastMonth.expenses * 1.1) {
      const increase = (((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100).toFixed(1);
      insights.push({ type: 'warning', title: 'Spending Increase', message: `Your spending is ${increase}% higher than last month`, icon: 'trending_up' });
    }

    if (currentMonth.income > 0) {
      const savingsRate = ((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100;
      if (savingsRate >= 20) {
        insights.push({ type: 'success', title: 'Great Savings Rate', message: `You're saving ${savingsRate.toFixed(1)}% of your income this month`, icon: 'savings' });
      } else if (savingsRate < 0) {
        insights.push({ type: 'danger', title: 'Over Budget', message: `You've spent ${Math.abs(savingsRate).toFixed(1)}% more than you earned`, icon: 'warning' });
      }
    }

    if (topCategories.length > 0) {
      const top = topCategories[0];
      insights.push({ type: 'info', title: 'Top Spending Category', message: `${top.categoryName} is your biggest expense at $${Number(top.total).toFixed(2)}`, icon: 'category' });
    }

    return insights;
  }

  private async getTotalBalance(userId: string): Promise<number> {
    const allTx = await this.transactionsService.getAllForUser(userId);
    return allTx.reduce(
      (sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount),
      0,
    );
  }

  private async getRecentTransactions(userId: string, limit: number) {
    const result = await this.transactionsService.findAll(userId, {
      page: 1,
      limit,
      sortBy: 'date',
      sortOrder: 'DESC',
    });
    return result.data;
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
      case 'yearly': {
        const yearStart = subYears(now, 4);
        return {
          startDate: startOfYear(yearStart),
          endDate: endOfYear(now),
          intervals: Array.from({ length: 5 }, (_, i) => new Date(yearStart.getFullYear() + i, 0, 1)),
          formatFn: (d: Date) => format(d, 'yyyy'),
        };
      }
      default:
        throw new Error('Invalid period');
    }
  }

  private buildChartData(intervals: Date[], dailyTotals: any[], formatFn: Function) {
    return intervals.map((interval) => {
      const label = formatFn(interval);
      const monthPrefix = format(interval, 'yyyy-MM');

      const income = dailyTotals
        .filter((d) => d.date?.toString()?.startsWith(monthPrefix) && d.type === TransactionType.INCOME)
        .reduce((sum, d) => sum + Number(d.total), 0);

      const expenses = dailyTotals
        .filter((d) => d.date?.toString()?.startsWith(monthPrefix) && d.type === TransactionType.EXPENSE)
        .reduce((sum, d) => sum + Number(d.total), 0);

      return { label, income, expenses, savings: income - expenses };
    });
  }

  private getPercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
  }
}
