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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const transaction_entity_1 = require("./entities/transaction.entity");
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
let TransactionsService = class TransactionsService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    col() {
        return this.firebase.collection('transactions');
    }
    docToTransaction(id, data) {
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
    async create(userId, dto) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        let categoryData = undefined;
        if (dto.categoryId) {
            try {
                const catDoc = await this.firebase.collection('categories').doc(dto.categoryId).get();
                if (catDoc.exists) {
                    const c = catDoc.data();
                    categoryData = { id: catDoc.id, name: c.name, icon: c.icon, color: c.color };
                }
            }
            catch (_) { }
        }
        const tx = {
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
    async findAll(userId, query) {
        const { type, categoryId, startDate, endDate, search, page = 1, limit = 20, sortBy = 'date', sortOrder = 'DESC', tag, } = query;
        let q = this.col().where('userId', '==', userId);
        if (type)
            q = q.where('type', '==', type);
        if (categoryId)
            q = q.where('categoryId', '==', categoryId);
        const snap = await q.get();
        let transactions = snap.docs.map((d) => this.docToTransaction(d.id, d.data()));
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
            transactions = transactions.filter((t) => t.title.toLowerCase().includes(s) ||
                (t.notes && t.notes.toLowerCase().includes(s)));
        }
        if (tag) {
            transactions = transactions.filter((t) => t.tags?.includes(tag));
        }
        const allowedSort = ['date', 'amount', 'title', 'createdAt'];
        const sf = allowedSort.includes(sortBy) ? sortBy : 'date';
        transactions.sort((a, b) => {
            const av = a[sf];
            const bv = b[sf];
            if (av < bv)
                return sortOrder === 'ASC' ? -1 : 1;
            if (av > bv)
                return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
        const total = transactions.length;
        const data = transactions.slice((page - 1) * limit, page * limit);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(userId, id) {
        const doc = await this.col().doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Transaction not found');
        const tx = this.docToTransaction(doc.id, doc.data());
        if (tx.userId !== userId)
            throw new common_1.NotFoundException('Transaction not found');
        return tx;
    }
    async update(userId, id, dto) {
        const tx = await this.findOne(userId, id);
        let categoryData = tx.category;
        if (dto.categoryId && dto.categoryId !== tx.categoryId) {
            try {
                const catDoc = await this.firebase.collection('categories').doc(dto.categoryId).get();
                if (catDoc.exists) {
                    const c = catDoc.data();
                    categoryData = { id: catDoc.id, name: c.name, icon: c.icon, color: c.color };
                }
            }
            catch (_) { }
        }
        const updates = {
            ...dto,
            date: dto.date ? new Date(dto.date) : tx.date,
            recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : tx.recurrenceEndDate,
            category: categoryData,
            updatedAt: new Date(),
        };
        await this.col().doc(id).update(this.firebase.clean(updates));
        return { ...tx, ...updates };
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        await this.col().doc(id).delete();
    }
    async getSummary(userId, startDate, endDate) {
        const snap = await this.col().where('userId', '==', userId).get();
        let income = 0;
        let expenses = 0;
        snap.docs.forEach((d) => {
            const tx = this.docToTransaction(d.id, d.data());
            if (tx.date >= startDate && tx.date <= endDate) {
                if (tx.type === transaction_entity_1.TransactionType.INCOME)
                    income += tx.amount;
                else
                    expenses += tx.amount;
            }
        });
        return { income, expenses, balance: income - expenses };
    }
    async getCategorySpending(userId, startDate, endDate) {
        const snap = await this.col()
            .where('userId', '==', userId)
            .where('type', '==', transaction_entity_1.TransactionType.EXPENSE)
            .get();
        const catSnap = await this.firebase.collection('categories').get();
        const catMap = new Map();
        catSnap.docs.forEach((d) => {
            const data = d.data();
            catMap.set(d.id, { name: data.name, icon: data.icon, color: data.color });
        });
        const map = new Map();
        snap.docs.forEach((d) => {
            const tx = this.docToTransaction(d.id, d.data());
            if (tx.date < startDate || tx.date > endDate)
                return;
            const key = tx.categoryId ?? 'uncategorized';
            const catInfo = (tx.categoryId && catMap.get(tx.categoryId)) || tx.category;
            const existing = map.get(key);
            if (existing) {
                existing.total += tx.amount;
                existing.count += 1;
            }
            else {
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
    async getDailyTotals(userId, startDate, endDate) {
        const snap = await this.col().where('userId', '==', userId).get();
        const map = new Map();
        snap.docs.forEach((d) => {
            const tx = this.docToTransaction(d.id, d.data());
            if (tx.date < startDate || tx.date > endDate)
                return;
            const dateStr = tx.date.toISOString().split('T')[0];
            const key = `${dateStr}_${tx.type}`;
            const existing = map.get(key);
            if (existing) {
                existing.total += tx.amount;
            }
            else {
                map.set(key, { date: dateStr, type: tx.type, total: tx.amount });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    async getAllForUser(userId) {
        const snap = await this.col().where('userId', '==', userId).get();
        return snap.docs.map((d) => this.docToTransaction(d.id, d.data()));
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
        const now = new Date();
        const batch = this.firebase.firestore().batch();
        dates.forEach((date) => {
            const id = (0, uuid_1.v4)();
            const ref = this.col().doc(id);
            const tx = {
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
    getNextDate(date, interval) {
        switch (interval) {
            case transaction_entity_1.RecurrenceInterval.DAILY: return (0, date_fns_1.addDays)(date, 1);
            case transaction_entity_1.RecurrenceInterval.WEEKLY: return (0, date_fns_1.addWeeks)(date, 1);
            case transaction_entity_1.RecurrenceInterval.BIWEEKLY: return (0, date_fns_1.addWeeks)(date, 2);
            case transaction_entity_1.RecurrenceInterval.MONTHLY: return (0, date_fns_1.addMonths)(date, 1);
            case transaction_entity_1.RecurrenceInterval.QUARTERLY: return (0, date_fns_1.addMonths)(date, 3);
            case transaction_entity_1.RecurrenceInterval.YEARLY: return (0, date_fns_1.addYears)(date, 1);
            default: return (0, date_fns_1.addMonths)(date, 1);
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map