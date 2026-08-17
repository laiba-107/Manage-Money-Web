import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
export declare enum TransactionType {
    INCOME = "income",
    EXPENSE = "expense"
}
export declare enum PaymentMethod {
    CASH = "cash",
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    BANK_TRANSFER = "bank_transfer",
    MOBILE_PAYMENT = "mobile_payment",
    OTHER = "other"
}
export declare enum RecurrenceInterval {
    DAILY = "daily",
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
export declare class Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    title: string;
    notes: string;
    date: Date;
    paymentMethod: PaymentMethod;
    receiptUrl: string;
    isRecurring: boolean;
    recurrenceInterval: RecurrenceInterval;
    recurrenceEndDate: Date;
    recurrenceParentId: string;
    currency: string;
    exchangeRate: number;
    tags: string[];
    userId: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    category: Category;
}
