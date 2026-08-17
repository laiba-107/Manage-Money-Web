import { BudgetPeriod } from '../entities/budget.entity';
export declare class CreateBudgetDto {
    name: string;
    amount: number;
    period: BudgetPeriod;
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    alertThreshold?: number;
    categoryId?: string;
    isActive?: boolean;
}
declare const UpdateBudgetDto_base: import("@nestjs/common").Type<Partial<CreateBudgetDto>>;
export declare class UpdateBudgetDto extends UpdateBudgetDto_base {
}
export {};
