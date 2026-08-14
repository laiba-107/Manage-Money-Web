import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Budget } from '../../budgets/entities/budget.entity';
import { Setting } from '../../settings/entities/setting.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password', nullable: true, select: false })
  password?: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId?: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'light' })
  theme: string;

  @Column({ name: 'biometric_enabled', nullable: true })
  biometricEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (t) => t.user)
  transactions: Transaction[];

  @OneToMany(() => Budget, (b) => b.user)
  budgets: Budget[];

  @OneToMany(() => Setting, (s) => s.user)
  settings: Setting[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];
}
