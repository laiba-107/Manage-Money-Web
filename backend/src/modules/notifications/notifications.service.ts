import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from './entities/notification.entity';
import { FirebaseService } from '../../firebase/firebase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.collection('notifications');
  }

  private docToNotification(id: string, data: FirebaseFirestore.DocumentData): Notification {
    return {
      id,
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type,
      data: data.data,
      isRead: data.isRead ?? false,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  }

  async create(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: any,
  ): Promise<Notification> {
    const id = uuidv4();
    const now = new Date();
    const notification: Notification = { id, userId, title, body, type, data, isRead: false, createdAt: now };
    await this.col().doc(id).set(notification);
    return notification;
  }

  async findAll(userId: string, unreadOnly = false) {
    let q: FirebaseFirestore.Query = this.col().where('userId', '==', userId);
    if (unreadOnly) q = q.where('isRead', '==', false);

    const snap = await q.get();
    const data = snap.docs
      .map((d) => this.docToNotification(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    const unreadSnap = await this.col()
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    return { data, total: data.length, unreadCount: unreadSnap.size };
  }

  async markAsRead(userId: string, id: string): Promise<void> {
    const doc = await this.col().doc(id).get();
    if (doc.exists && doc.data()!.userId === userId) {
      await this.col().doc(id).update({ isRead: true });
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const snap = await this.col()
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    if (snap.empty) return;
    const batch = this.firebase.firestore().batch();
    snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }

  async delete(userId: string, id: string): Promise<void> {
    const doc = await this.col().doc(id).get();
    if (doc.exists && doc.data()!.userId === userId) {
      await this.col().doc(id).delete();
    }
  }
}
