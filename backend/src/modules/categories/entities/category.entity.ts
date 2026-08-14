import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Budget } from '../../budgets/entities/budget.entity';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BOTH = 'both',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'enum', enum: CategoryType, default: CategoryType.EXPENSE })
  type: CategoryType;

  @Column({ name: 'is_default', default: true })
  isDefault: boolean;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (t) => t.category)
  transactions: Transaction[];

  @OneToMany(() => Budget, (b) => b.category)
  budgets: Budget[];
}
