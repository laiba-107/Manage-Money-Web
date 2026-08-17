import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
export declare class NotificationsService {
    private notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    create(userId: string, title: string, body: string, type: NotificationType, data?: any): Promise<Notification>;
    findAll(userId: string, unreadOnly?: boolean): Promise<{
        data: Notification[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(userId: string, id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    delete(userId: string, id: string): Promise<void>;
}
