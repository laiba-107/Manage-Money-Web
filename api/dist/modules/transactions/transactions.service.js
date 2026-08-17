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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const date_fns_1 = require("date-fns");
let TransactionsService = class TransactionsService {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }
    async create(userId, dto) {
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
    async findAll(userId, query) {
        const { type, categoryId, startDate, endDate, search, page = 1, limit = 20, sortBy = 'date', sortOrder = 'DESC', tag, } = query;
        const qb = this.transactionRepository
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.category', 'category')
            .where('t.userId = :userId', { userId });
        if (type)
            qb.andWhere('t.type = :type', { type });
        if (categoryId)
            qb.andWhere('t.categoryId = :categoryId', { categoryId });
        if (startDate)
            qb.andWhere('t.date >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('t.date <= :endDate', { endDate });
        if (search) {
            qb.andWhere('(t.title ILIKE :search OR t.notes ILIKE :search)', {
                search: `%${search}%`,
            });
        }
        if (tag)
            qb.andWhere(':tag = ANY(t.tags)', { tag });
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
    async findOne(userId, id) {
        const transaction = await this.transactionRepository.findOne({
            where: { id, userId },
            relations: ['category'],
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        return transaction;
    }
    async update(userId, id, dto) {
        const transaction = await this.findOne(userId, id);
        delete transaction.category;
        let targetCategoryId = dto.categoryId;
        if (!targetCategoryId && dto.title) {
            const cat = await this.transactionRepository.manager.findOne('categories', {
                where: [
                    { name: dto.title },
                    { name: dto.title, type: dto.type || transaction.type },
                ],
            });
            if (cat) {
                targetCategoryId = cat.id;
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
    async remove(userId, id) {
        const transaction = await this.findOne(userId, id);
        await this.transactionRepository.remove(transaction);
    }
    async getSummary(userId, startDate, endDate) {
        const result = await this.transactionRepository
            .createQueryBuilder('t')
            .select('t.type', 'type')
            .addSelect('SUM(t.amount)', 'total')
            .where('t.userId = :userId', { userId })
            .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('t.type')
            .getRawMany();
        const income = parseFloat(result.find((r) => r.type === transaction_entity_1.TransactionType.INCOME)?.total || '0');
        const expenses = parseFloat(result.find((r) => r.type === transaction_entity_1.TransactionType.EXPENSE)?.total || '0');
        return { income, expenses, balance: income - expenses };
    }
    async getCategorySpending(userId, startDate, endDate) {
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
            .andWhere('t.type = :type', { type: transaction_entity_1.TransactionType.EXPENSE })
            .andWhere('t.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('c.id, c.name, c.icon, c.color')
            .orderBy('total', 'DESC')
            .getRawMany();
    }
    async getDailyTotals(userId, startDate, endDate) {
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
    async createRecurringTransactions(parent) {
        if (!parent.recurrenceInterval)
            return;
        const endDate = parent.recurrenceEndDate
            ? new Date(parent.recurrenceEndDate)
            : (0, date_fns_1.addYears)(new Date(parent.date), 1);
        const dates = [];
        let current = new Date(parent.date);
        while ((0, date_fns_1.isBefore)(current, endDate) && dates.length < 365) {
            current = this.getNextDate(current, parent.recurrenceInterval);
            if ((0, date_fns_1.isBefore)(current, endDate)) {
                dates.push(new Date(current));
            }
        }
        const recurring = dates.map((date) => this.transactionRepository.create({
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
        }));
        await this.transactionRepository.save(recurring);
    }
    getNextDate(date, interval) {
        switch (interval) {
            case transaction_entity_1.RecurrenceInterval.DAILY:
                return (0, date_fns_1.addDays)(date, 1);
            case transaction_entity_1.RecurrenceInterval.WEEKLY:
                return (0, date_fns_1.addWeeks)(date, 1);
            case transaction_entity_1.RecurrenceInterval.BIWEEKLY:
                return (0, date_fns_1.addWeeks)(date, 2);
            case transaction_entity_1.RecurrenceInterval.MONTHLY:
                return (0, date_fns_1.addMonths)(date, 1);
            case transaction_entity_1.RecurrenceInterval.QUARTERLY:
                return (0, date_fns_1.addMonths)(date, 3);
            case transaction_entity_1.RecurrenceInterval.YEARLY:
                return (0, date_fns_1.addYears)(date, 1);
            default:
                return (0, date_fns_1.addMonths)(date, 1);
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map