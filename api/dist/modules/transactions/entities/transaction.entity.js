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
exports.Transaction = exports.RecurrenceInterval = exports.PaymentMethod = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const category_entity_1 = require("../../categories/entities/category.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "income";
    TransactionType["EXPENSE"] = "expense";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["MOBILE_PAYMENT"] = "mobile_payment";
    PaymentMethod["OTHER"] = "other";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var RecurrenceInterval;
(function (RecurrenceInterval) {
    RecurrenceInterval["DAILY"] = "daily";
    RecurrenceInterval["WEEKLY"] = "weekly";
    RecurrenceInterval["BIWEEKLY"] = "biweekly";
    RecurrenceInterval["MONTHLY"] = "monthly";
    RecurrenceInterval["QUARTERLY"] = "quarterly";
    RecurrenceInterval["YEARLY"] = "yearly";
})(RecurrenceInterval || (exports.RecurrenceInterval = RecurrenceInterval = {}));
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TransactionType }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Transaction.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Transaction.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_method',
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
        nullable: true,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receipt_url', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "receiptUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_recurring', default: false }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "isRecurring", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'recurrence_interval',
        type: 'enum',
        enum: RecurrenceInterval,
        nullable: true,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "recurrenceInterval", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recurrence_end_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "recurrenceEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recurrence_parent_id', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "recurrenceParentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'USD' }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exchange_rate', type: 'decimal', precision: 10, scale: 4, default: 1 }),
    __metadata("design:type", Number)
], Transaction.prototype, "exchangeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Transaction.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Transaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.transactions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (c) => c.transactions, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Transaction.prototype, "category", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions'),
    (0, typeorm_1.Index)(['userId', 'date']),
    (0, typeorm_1.Index)(['userId', 'type'])
], Transaction);
//# sourceMappingURL=transaction.entity.js.map