import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { User } from '../users/entities/user.entity';
export declare class TransactionsController {
    private transactionsService;
    constructor(transactionsService: TransactionsService);
    create(user: User, dto: CreateTransactionDto): Promise<{
        data: import("./entities/transaction.entity").Transaction;
        message: string;
    }>;
    findAll(user: User, query: QueryTransactionDto): Promise<{
        data: import("./entities/transaction.entity").Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        message: string;
    }>;
    getSummary(user: User, startDate: string, endDate: string): Promise<{
        data: {
            income: number;
            expenses: number;
            balance: number;
        };
        message: string;
    }>;
    findOne(user: User, id: string): Promise<{
        data: import("./entities/transaction.entity").Transaction;
        message: string;
    }>;
    update(user: User, id: string, dto: UpdateTransactionDto): Promise<{
        data: import("./entities/transaction.entity").Transaction;
        message: string;
    }>;
    remove(user: User, id: string): Promise<void>;
}
