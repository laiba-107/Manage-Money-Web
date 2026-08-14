import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  BUDGET_ALERT = 'budget_alert',
  BILL_REMINDER = 'bill_reminder',
  RECURRING_TRANSACTION = 'recurring_transaction',
  WEEKLY_SUMMARY = 'weekly_summary',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
