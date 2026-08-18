"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceInterval = exports.PaymentMethod = exports.TransactionType = void 0;
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
//# sourceMappingURL=transaction.entity.js.map