import { AnalyticsService, ReportPeriod } from './analytics.service';
import { User } from '../users/entities/user.entity';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(user: User): Promise<{
        data: {
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
        };
        message: string;
    }>;
    getReport(user: User, period?: ReportPeriod, date?: string): Promise<{
        data: {
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
        };
        message: string;
    }>;
    getTrends(user: User, months?: number): Promise<{
        data: any[];
        message: string;
    }>;
    getInsights(user: User): Promise<{
        data: any[];
        message: string;
    }>;
}
