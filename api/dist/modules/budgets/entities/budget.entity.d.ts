import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
export declare enum BudgetPeriod {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    CUSTOM = "custom"
}
export declare class Budget {
    id: string;
    name: string;
    amount: number;
    period: BudgetPeriod;
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    alertThreshold: number;
    alertSent: boolean;
    userId: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    category: Category;
}
