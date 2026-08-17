import { User } from '../../users/entities/user.entity';
export declare enum NotificationType {
    BUDGET_ALERT = "budget_alert",
    BILL_REMINDER = "bill_reminder",
    RECURRING_TRANSACTION = "recurring_transaction",
    WEEKLY_SUMMARY = "weekly_summary",
    SYSTEM = "system"
}
export declare class Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data: any;
    isRead: boolean;
    createdAt: Date;
    user: User;
}
