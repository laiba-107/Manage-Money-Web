import { FirebaseService } from '../../firebase/firebase.service';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare class TransactionsService {
    private readonly firebase;
    constructor(firebase: FirebaseService);
    private col;
    private docToTransaction;
    create(userId: string, dto: CreateTransactionDto): Promise<Transaction>;
    findAll(userId: string, query: QueryTransactionDto): Promise<PaginatedResult<Transaction>>;
    findOne(userId: string, id: string): Promise<Transaction>;
    update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction>;
    remove(userId: string, id: string): Promise<void>;
    getSummary(userId: string, startDate: Date, endDate: Date): Promise<{
        income: number;
        expenses: number;
        balance: number;
    }>;
    getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
    getDailyTotals(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
    getAllForUser(userId: string): Promise<Transaction[]>;
    private createRecurringTransactions;
    private getNextDate;
}
