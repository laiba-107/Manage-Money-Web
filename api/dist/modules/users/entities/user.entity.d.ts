import { Transaction } from '../../transactions/entities/transaction.entity';
import { Budget } from '../../budgets/entities/budget.entity';
import { Setting } from '../../settings/entities/setting.entity';
import { Notification } from '../../notifications/entities/notification.entity';
export declare class User {
    id: string;
    email: string;
    password?: string;
    displayName: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
    googleId?: string;
    refreshToken: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt: Date;
    timezone: string;
    currency: string;
    theme: string;
    biometricEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    transactions: Transaction[];
    budgets: Budget[];
    settings: Setting[];
    notifications: Notification[];
}
