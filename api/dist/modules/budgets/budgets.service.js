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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const budget_entity_1 = require("./entities/budget.entity");
const transactions_service_1 = require("../transactions/transactions.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const date_fns_1 = require("date-fns");
let BudgetsService = class BudgetsService {
    constructor(budgetRepository, transactionsService) {
        this.budgetRepository = budgetRepository;
        this.transactionsService = transactionsService;
    }
    async create(userId, dto) {
        const budget = this.budgetRepository.create({ ...dto, userId });
        if (dto.startDate)
            budget.startDate = new Date(dto.startDate);
        if (dto.endDate)
            budget.endDate = new Date(dto.endDate);
        return this.budgetRepository.save(budget);
    }
    async findAll(userId) {
        const budgets = await this.budgetRepository.find({
            where: { userId, isActive: true },
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });
        return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
    }
    async findOne(userId, id) {
        const budget = await this.budgetRepository.findOne({
            where: { id, userId },
            relations: ['category'],
        });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        return this.enrichWithUsage(budget);
    }
    async update(userId, id, dto) {
        const budget = await this.budgetRepository.findOne({ where: { id, userId } });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        Object.assign(budget, dto);
        if (dto.startDate)
            budget.startDate = new Date(dto.startDate);
        if (dto.endDate)
            budget.endDate = new Date(dto.endDate);
        return this.budgetRepository.save(budget);
    }
    async remove(userId, id) {
        const budget = await this.budgetRepository.findOne({ where: { id, userId } });
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        await this.budgetRepository.remove(budget);
    }
    async getMonthlyBudgetStatus(userId, month, year) {
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
    async enrichWithUsage(budget) {
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
    getBudgetDateRange(budget) {
        if (budget.startDate && budget.endDate) {
            return { startDate: budget.startDate, endDate: budget.endDate };
        }
        const now = new Date();
        if (budget.month && budget.year) {
            const date = new Date(budget.year, budget.month - 1, 1);
            return { startDate: (0, date_fns_1.startOfMonth)(date), endDate: (0, date_fns_1.endOfMonth)(date) };
        }
        return { startDate: (0, date_fns_1.startOfMonth)(now), endDate: (0, date_fns_1.endOfMonth)(now) };
    }
    async getSpentAmount(budget, startDate, endDate) {
        const query = this.budgetRepository.manager
            .createQueryBuilder()
            .select('COALESCE(SUM(t.amount), 0)', 'total')
            .from('transactions', 't')
            .where('t.userId = :userId', { userId: budget.userId })
            .andWhere('t.type = :type', { type: transaction_entity_1.TransactionType.EXPENSE })
            .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate });
        if (budget.categoryId) {
            query.andWhere('t.categoryId = :categoryId', {
                categoryId: budget.categoryId,
            });
        }
        const result = await query.getRawOne();
        return parseFloat(result?.total || '0');
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(budget_entity_1.Budget)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transactions_service_1.TransactionsService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map