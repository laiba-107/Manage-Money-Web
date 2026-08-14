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

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Entity('budgets')
@Index(['userId', 'month', 'year'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod;

  @Column({ nullable: true })
  month: number;

  @Column({ nullable: true })
  year: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'alert_threshold', default: 80 })
  alertThreshold: number;

  @Column({ name: 'alert_sent', default: false })
  alertSent: boolean;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (u) => u.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (c) => c.budgets, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
