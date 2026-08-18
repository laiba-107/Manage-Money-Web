export declare enum BudgetPeriod {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    CUSTOM = "custom"
}
export interface Budget {
    id: string;
    userId: string;
    name: string;
    amount: number;
    period: BudgetPeriod;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    alertThreshold: number;
    alertSent: boolean;
    categoryId?: string;
    category?: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
