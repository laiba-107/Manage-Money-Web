import { TransactionType, PaymentMethod, RecurrenceInterval } from '../entities/transaction.entity';
export declare class CreateTransactionDto {
    amount: number;
    type: TransactionType;
    title: string;
    notes?: string;
    date: string;
    paymentMethod?: PaymentMethod;
    categoryId?: string;
    receiptUrl?: string;
    isRecurring?: boolean;
    recurrenceInterval?: RecurrenceInterval;
    recurrenceEndDate?: string;
    currency?: string;
    tags?: string[];
}
declare const UpdateTransactionDto_base: import("@nestjs/common").Type<Partial<CreateTransactionDto>>;
export declare class UpdateTransactionDto extends UpdateTransactionDto_base {
}
export {};
