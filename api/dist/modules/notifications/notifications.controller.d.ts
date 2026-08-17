import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: User, unreadOnly?: boolean): Promise<{
        data: import("./entities/notification.entity").Notification[];
        meta: {
            total: number;
            unreadCount: number;
        };
        message: string;
    }>;
    markAllAsRead(user: User): Promise<{
        message: string;
    }>;
    markAsRead(user: User, id: string): Promise<{
        message: string;
    }>;
    delete(user: User, id: string): Promise<void>;
}
