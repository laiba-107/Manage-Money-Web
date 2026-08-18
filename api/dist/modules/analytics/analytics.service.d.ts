import { TransactionsService } from '../transactions/transactions.service';
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export declare class AnalyticsService {
    private transactionsService;
    constructor(transactionsService: TransactionsService);
    getDashboardData(userId: string): Promise<{
        totalBalance: number;
        currentMonth: {
            income: number;
            expenses: number;
            balance: number;
        };
        lastMonth: {
            income: number;
            expenses: number;
            balance: number;
        };
        incomeChange: number;
        expenseChange: number;
        recentTransactions: import("../transactions/entities/transaction.entity").Transaction[];
        categorySpending: any[];
        savingsRate: number;
    }>;
    getReport(userId: string, period: ReportPeriod, date?: Date): Promise<{
        period: ReportPeriod;
        startDate: Date;
        endDate: Date;
        summary: {
            income: number;
            expenses: number;
            balance: number;
        };
        chartData: {
            label: any;
            income: any;
            expenses: any;
            savings: number;
        }[];
        categorySpending: any[];
        topCategories: any[];
    }>;
    getSpendingTrends(userId: string, months?: number): Promise<any[]>;
    getInsights(userId: string): Promise<any[]>;
    private getTotalBalance;
    private getRecentTransactions;
    private getPeriodConfig;
    private buildChartData;
    private getPercentageChange;
}
