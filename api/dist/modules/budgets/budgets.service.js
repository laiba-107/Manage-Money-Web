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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const budget_entity_1 = require("./entities/budget.entity");
const transactions_service_1 = require("../transactions/transactions.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
let BudgetsService = class BudgetsService {
    constructor(firebase, transactionsService) {
        this.firebase = firebase;
        this.transactionsService = transactionsService;
    }
    col() {
        return this.firebase.collection('budgets');
    }
    docToBudget(id, data) {
        return {
            id,
            userId: data.userId,
            name: data.name,
            amount: Number(data.amount),
            period: data.period ?? budget_entity_1.BudgetPeriod.MONTHLY,
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
    async create(userId, dto) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const budget = {
            id,
            userId,
            name: dto.name,
            amount: Number(dto.amount),
            period: dto.period ?? budget_entity_1.BudgetPeriod.MONTHLY,
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
    async findAll(userId) {
        const snap = await this.col()
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .get();
        const budgets = snap.docs.map((d) => this.docToBudget(d.id, d.data()));
        budgets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
    }
    async findOne(userId, id) {
        const doc = await this.col().doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Budget not found');
        const budget = this.docToBudget(doc.id, doc.data());
        if (budget.userId !== userId)
            throw new common_1.NotFoundException('Budget not found');
        return this.enrichWithUsage(budget);
    }
    async update(userId, id, dto) {
        const doc = await this.col().doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Budget not found');
        const budget = this.docToBudget(doc.id, doc.data());
        if (budget.userId !== userId)
            throw new common_1.NotFoundException('Budget not found');
        const updates = {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : budget.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : budget.endDate,
            updatedAt: new Date(),
        };
        await this.col().doc(id).update(this.firebase.clean(updates));
        return { ...budget, ...updates };
    }
    async remove(userId, id) {
        const doc = await this.col().doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Budget not found');
        const budget = this.docToBudget(doc.id, doc.data());
        if (budget.userId !== userId)
            throw new common_1.NotFoundException('Budget not found');
        await this.col().doc(id).delete();
    }
    async getMonthlyBudgetStatus(userId, month, year) {
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
            if (!b.month && !b.year)
                return true;
            return b.month === targetMonth && b.year === targetYear;
        });
        return Promise.all(budgets.map((b) => this.enrichWithUsage(b)));
    }
    async enrichWithUsage(budget) {
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
        const transactions = await this.transactionsService.getAllForUser(budget.userId);
        return transactions
            .filter((t) => t.type === transaction_entity_1.TransactionType.EXPENSE &&
            t.date >= startDate &&
            t.date <= endDate &&
            (!budget.categoryId || t.categoryId === budget.categoryId))
            .reduce((sum, t) => sum + t.amount, 0);
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        transactions_service_1.TransactionsService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map