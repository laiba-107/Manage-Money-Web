"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const transactions_service_1 = require("../transactions/transactions.service");
const date_fns_1 = require("date-fns");
let AnalyticsService = class AnalyticsService {
    constructor(transactionRepository, transactionsService) {
        this.transactionRepository = transactionRepository;
        this.transactionsService = transactionsService;
    }
    async getDashboardData(userId) {
        const now = new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(now);
        const monthEnd = (0, date_fns_1.endOfMonth)(now);
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const [currentMonth, lastMonth, recentTransactions, categorySpending] = await Promise.all([
            this.transactionsService.getSummary(userId, monthStart, monthEnd),
            this.transactionsService.getSummary(userId, lastMonthStart, lastMonthEnd),
            this.getRecentTransactions(userId, 5),
            this.transactionsService.getCategorySpending(userId, monthStart, monthEnd),
        ]);
        const totalBalance = await this.getTotalBalance(userId);
        const incomeChange = this.getPercentageChange(lastMonth.income, currentMonth.income);
        const expenseChange = this.getPercentageChange(lastMonth.expenses, currentMonth.expenses);
        return {
            totalBalance,
            currentMonth,
            lastMonth,
            incomeChange,
            expenseChange,
            recentTransactions,
            categorySpending: categorySpending.slice(0, 5),
            savingsRate: currentMonth.income > 0
                ? ((currentMonth.income - currentMonth.expenses) / currentMonth.income) * 100
                : 0,
        };
    }
    async getReport(userId, period, date) {
        const now = date || new Date();
        const { startDate, endDate, intervals, formatFn } = this.getPeriodConfig(period, now);
        const dailyTotals = await this.transactionsService.getDailyTotals(userId, startDate, endDate);
        const chartData = this.buildChartData(intervals, dailyTotals, formatFn);
        const summary = await this.transactionsService.getSummary(userId, startDate, endDate);
        const categorySpending = await this.transactionsService.getCategorySpending(userId, startDate, endDate);
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
    async getSpendingTrends(userId, months = 6) {
        const now = new Date();
        const trends = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = (0, date_fns_1.subMonths)(now, i);
            const start = (0, date_fns_1.startOfMonth)(date);
            const end = (0, date_fns_1.endOfMonth)(date);
            const summary = await this.transactionsService.getSummary(userId, start, end);
            trends.push({
                month: (0, date_fns_1.format)(date, 'MMM yyyy'),
                ...summary,
                savings: summary.income - summary.expenses,
            });
        }
        return trends;
    }
    async getInsights(userId) {
        const now = new Date();
        const monthStart = (0, date_fns_1.startOfMonth)(now);
        const monthEnd = (0, date_fns_1.endOfMonth)(now);
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const [currentMonth, lastMonth, topCategories] = await Promise.all([
            this.transactionsService.getSummary(userId, monthStart, monthEnd),
            this.transactionsService.getSummary(userId, lastMonthStart, lastMonthEnd),
            this.transactionsService.getCategorySpending(userId, monthStart, monthEnd),
        ]);
        const insights = [];
        if (currentMonth.expenses > lastMonth.expenses * 1.1) {
            const increase = (((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) *
                100).toFixed(1);
            insights.push({
                type: 'warning',
                title: 'Spending Increase',
                message: `Your spending is ${increase}% higher than last month`,
                icon: 'trending_up',
            });
        }
        if (currentMonth.income > 0) {
            const savingsRate = ((currentMonth.income - currentMonth.expenses) / currentMonth.income) *
                100;
            if (savingsRate >= 20) {
                insights.push({
                    type: 'success',
                    title: 'Great Savings Rate',
                    message: `You're saving ${savingsRate.toFixed(1)}% of your income this month`,
                    icon: 'savings',
                });
            }
            else if (savingsRate < 0) {
                insights.push({
                    type: 'danger',
                    title: 'Over Budget',
                    message: `You've spent ${Math.abs(savingsRate).toFixed(1)}% more than you earned`,
                    icon: 'warning',
                });
            }
        }
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
    async getTotalBalance(userId) {
        const result = await this.transactionRepository
            .createQueryBuilder('t')
            .select(`SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)`, 'balance')
            .where('t.userId = :userId', { userId })
            .getRawOne();
        return parseFloat(result?.balance || '0');
    }
    async getRecentTransactions(userId, limit) {
        return this.transactionRepository.find({
            where: { userId },
            relations: ['category'],
            order: { date: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
    }
    getPeriodConfig(period, now) {
        switch (period) {
            case 'daily':
                return {
                    startDate: (0, date_fns_1.startOfMonth)(now),
                    endDate: (0, date_fns_1.endOfMonth)(now),
                    intervals: (0, date_fns_1.eachDayOfInterval)({ start: (0, date_fns_1.startOfMonth)(now), end: (0, date_fns_1.endOfMonth)(now) }),
                    formatFn: (d) => (0, date_fns_1.format)(d, 'MMM dd'),
                };
            case 'weekly':
                return {
                    startDate: (0, date_fns_1.startOfYear)(now),
                    endDate: (0, date_fns_1.endOfYear)(now),
                    intervals: (0, date_fns_1.eachWeekOfInterval)({ start: (0, date_fns_1.startOfYear)(now), end: (0, date_fns_1.endOfYear)(now) }),
                    formatFn: (d) => `W${(0, date_fns_1.format)(d, 'ww')}`,
                };
            case 'monthly':
                return {
                    startDate: (0, date_fns_1.startOfYear)(now),
                    endDate: (0, date_fns_1.endOfYear)(now),
                    intervals: (0, date_fns_1.eachMonthOfInterval)({ start: (0, date_fns_1.startOfYear)(now), end: (0, date_fns_1.endOfYear)(now) }),
                    formatFn: (d) => (0, date_fns_1.format)(d, 'MMM'),
                };
            case 'yearly':
                const yearStart = (0, date_fns_1.subYears)(now, 4);
                return {
                    startDate: (0, date_fns_1.startOfYear)(yearStart),
                    endDate: (0, date_fns_1.endOfYear)(now),
                    intervals: Array.from({ length: 5 }, (_, i) => new Date(yearStart.getFullYear() + i, 0, 1)),
                    formatFn: (d) => (0, date_fns_1.format)(d, 'yyyy'),
                };
            default:
                throw new Error('Invalid period');
        }
    }
    buildChartData(intervals, dailyTotals, formatFn) {
        return intervals.map((interval) => {
            const label = formatFn(interval);
            const dayStr = (0, date_fns_1.format)(interval, 'yyyy-MM-dd');
            const income = dailyTotals
                .filter((d) => d.date?.toString()?.startsWith(dayStr.substring(0, 7)))
                .filter((d) => d.type === transaction_entity_1.TransactionType.INCOME)
                .reduce((sum, d) => sum + parseFloat(d.total), 0);
            const expenses = dailyTotals
                .filter((d) => d.date?.toString()?.startsWith(dayStr.substring(0, 7)))
                .filter((d) => d.type === transaction_entity_1.TransactionType.EXPENSE)
                .reduce((sum, d) => sum + parseFloat(d.total), 0);
            return { label, income, expenses, savings: income - expenses };
        });
    }
    getPercentageChange(oldValue, newValue) {
        if (oldValue === 0)
            return newValue > 0 ? 100 : 0;
        return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transactions_service_1.TransactionsService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map