import { Transaction } from '../../transactions/entities/transaction.entity';
import { Budget } from '../../budgets/entities/budget.entity';
export declare enum CategoryType {
    INCOME = "income",
    EXPENSE = "expense",
    BOTH = "both"
}
export declare class Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    isDefault: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    transactions: Transaction[];
    budgets: Budget[];
}
