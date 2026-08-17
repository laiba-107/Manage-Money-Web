import { TransactionType } from '../entities/transaction.entity';
export declare class QueryTransactionDto {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    tag?: string;
}
