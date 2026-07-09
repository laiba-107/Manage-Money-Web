import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId, title, body, type, data,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string, unreadOnly = false) {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .take(50);

    if (unreadOnly) query.andWhere('n.isRead = false');

    const [data, total] = await query.getManyAndCount();
    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { data, total, unreadCount };
  }

  async markAsRead(userId: string, id: string): Promise<void> {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }
}
