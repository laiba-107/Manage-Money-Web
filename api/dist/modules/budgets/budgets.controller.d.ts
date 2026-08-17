import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { User } from '../users/entities/user.entity';
export declare class BudgetsController {
    private budgetsService;
    constructor(budgetsService: BudgetsService);
    create(user: User, dto: CreateBudgetDto): Promise<{
        data: import("./entities/budget.entity").Budget;
        message: string;
    }>;
    findAll(user: User): Promise<{
        data: import("./budgets.service").BudgetWithUsage[];
        message: string;
    }>;
    getMonthlyStatus(user: User, month?: number, year?: number): Promise<{
        data: import("./budgets.service").BudgetWithUsage[];
        message: string;
    }>;
    findOne(user: User, id: string): Promise<{
        data: import("./budgets.service").BudgetWithUsage;
        message: string;
    }>;
    update(user: User, id: string, dto: UpdateBudgetDto): Promise<{
        data: import("./entities/budget.entity").Budget;
        message: string;
    }>;
    remove(user: User, id: string): Promise<void>;
}
