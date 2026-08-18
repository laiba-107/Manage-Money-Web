import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SETTINGS = {
  currency: 'USD',
  theme: 'light',
  language: 'en',
  notifications: {
    budgetAlerts: true,
    billReminders: true,
    weeklyReport: true,
    recurringTransactions: true,
  },
  privacy: {
    showBalance: true,
    analytics: true,
  },
  dateFormat: 'MM/dd/yyyy',
  numberFormat: 'en-US',
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly firebase: FirebaseService,
    private usersService: UsersService,
  ) {}

  private col() {
    return this.firebase.collection('settings');
  }

  async getAll(userId: string): Promise<Record<string, any>> {
    const snap = await this.col().where('userId', '==', userId).get();
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    snap.docs.forEach((d) => {
      const data = d.data();
      result[data.key] = data.value;
    });

    const user = await this.usersService.findById(userId);
    if (user) {
      result['currency'] = user.currency;
      result['theme'] = user.theme;
    }

    return result;
  }

  async update(userId: string, key: string, value: any): Promise<void> {
    const snap = await this.col()
      .where('userId', '==', userId)
      .where('key', '==', key)
      .limit(1)
      .get();

    const now = new Date();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ value, updatedAt: now });
    } else {
      const id = uuidv4();
      await this.col().doc(id).set({ id, userId, key, value, createdAt: now, updatedAt: now });
    }

    if (key === 'currency') {
      await this.usersService.updateCurrency(userId, value);
    } else if (key === 'theme') {
      await this.usersService.updateTheme(userId, value);
    }
  }

  async updateMany(userId: string, updates: Record<string, any>): Promise<void> {
    await Promise.all(
      Object.entries(updates).map(([key, value]) => this.update(userId, key, value)),
    );
  }
}
