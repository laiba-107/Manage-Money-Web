import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { TransactionsService } from '../transactions/transactions.service';
export interface BudgetWithUsage extends Budget {
    spent: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
}
export declare class BudgetsService {
    private budgetRepository;
    private transactionsService;
    constructor(budgetRepository: Repository<Budget>, transactionsService: TransactionsService);
    create(userId: string, dto: CreateBudgetDto): Promise<Budget>;
    findAll(userId: string): Promise<BudgetWithUsage[]>;
    findOne(userId: string, id: string): Promise<BudgetWithUsage>;
    update(userId: string, id: string, dto: UpdateBudgetDto): Promise<Budget>;
    remove(userId: string, id: string): Promise<void>;
    getMonthlyBudgetStatus(userId: string, month?: number, year?: number): Promise<BudgetWithUsage[]>;
    private enrichWithUsage;
    private getBudgetDateRange;
    private getSpentAmount;
}
