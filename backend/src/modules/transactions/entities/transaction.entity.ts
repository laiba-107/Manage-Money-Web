import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_PAYMENT = 'mobile_payment',
  OTHER = 'other',
}

export enum RecurrenceInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('transactions')
@Index(['userId', 'date'])
@Index(['userId', 'type'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  title: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'receipt_url', nullable: true })
  receiptUrl: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({
    name: 'recurrence_interval',
    type: 'enum',
    enum: RecurrenceInterval,
    nullable: true,
  })
  recurrenceInterval: RecurrenceInterval;

  @Column({ name: 'recurrence_end_date', type: 'date', nullable: true })
  recurrenceEndDate: Date;

  @Column({ name: 'recurrence_parent_id', nullable: true })
  recurrenceParentId: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 10, scale: 4, default: 1 })
  exchangeRate: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (u) => u.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (c) => c.transactions, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
