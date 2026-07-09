import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UsersService } from '../users/users.service';

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
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private usersService: UsersService,
  ) {}

  async getAll(userId: string): Promise<Record<string, any>> {
    const settings = await this.settingRepository.find({
      where: { userId },
    });

    const result = { ...DEFAULT_SETTINGS };
    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    const user = await this.usersService.findById(userId);
    if (user) {
      result['currency'] = user.currency;
      result['theme'] = user.theme;
    }

    return result;
  }

  async update(userId: string, key: string, value: any): Promise<void> {
    const existing = await this.settingRepository.findOne({
      where: { userId, key },
    });

    if (existing) {
      existing.value = value;
      await this.settingRepository.save(existing);
    } else {
      const setting = this.settingRepository.create({ userId, key, value });
      await this.settingRepository.save(setting);
    }

    // Sync user entity for common settings
    if (key === 'currency') {
      await this.usersService.updateCurrency(userId, value);
    } else if (key === 'theme') {
      await this.usersService.updateTheme(userId, value);
    }
  }

  async updateMany(userId: string, updates: Record<string, any>): Promise<void> {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        this.update(userId, key, value),
      ),
    );
  }
}
