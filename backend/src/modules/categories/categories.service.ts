import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Category, CategoryType } from './entities/category.entity';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', icon: 'work', color: '#4CAF50', type: CategoryType.INCOME },
  { name: 'Freelance', icon: 'laptop', color: '#2196F3', type: CategoryType.INCOME },
  { name: 'Business', icon: 'business', color: '#9C27B0', type: CategoryType.INCOME },
  { name: 'Investments', icon: 'trending_up', color: '#FF9800', type: CategoryType.INCOME },
  { name: 'Other Income', icon: 'attach_money', color: '#00BCD4', type: CategoryType.INCOME },
  // Expense categories
  { name: 'Food & Dining', icon: 'restaurant', color: '#F44336', type: CategoryType.EXPENSE },
  { name: 'Transport', icon: 'directions_car', color: '#FF5722', type: CategoryType.EXPENSE },
  { name: 'Bills & Utilities', icon: 'receipt', color: '#795548', type: CategoryType.EXPENSE },
  { name: 'Shopping', icon: 'shopping_bag', color: '#E91E63', type: CategoryType.EXPENSE },
  { name: 'Rent & Housing', icon: 'home', color: '#607D8B', type: CategoryType.EXPENSE },
  { name: 'Entertainment', icon: 'movie', color: '#9C27B0', type: CategoryType.EXPENSE },
  { name: 'Healthcare', icon: 'local_hospital', color: '#F44336', type: CategoryType.EXPENSE },
  { name: 'Education', icon: 'school', color: '#3F51B5', type: CategoryType.EXPENSE },
  { name: 'Travel', icon: 'flight', color: '#00BCD4', type: CategoryType.EXPENSE },
  { name: 'Savings', icon: 'savings', color: '#4CAF50', type: CategoryType.EXPENSE },
  { name: 'Insurance', icon: 'security', color: '#FF9800', type: CategoryType.EXPENSE },
  { name: 'Personal Care', icon: 'spa', color: '#E91E63', type: CategoryType.EXPENSE },
  { name: 'Return & Refunds', icon: 'settings_backup_restore', color: '#14b8a6', type: CategoryType.EXPENSE },
  { name: 'Other', icon: 'category', color: '#9E9E9E', type: CategoryType.BOTH },
];

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async onApplicationBootstrap() {
    await this.seedDefaultCategories();
  }

  private col() {
    return this.firebase.collection('categories');
  }

  private docToCategory(id: string, data: FirebaseFirestore.DocumentData): Category {
    return {
      id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type ?? CategoryType.EXPENSE,
      isDefault: data.isDefault ?? false,
      userId: data.userId ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }

  async findAll(userId?: string): Promise<Category[]> {
    const snap = await this.col().get();
    return snap.docs
      .map((d) => this.docToCategory(d.id, d.data()))
      .filter((c) => c.isDefault || (userId && c.userId === userId))
      .sort((a, b) => {
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  async findByType(type: CategoryType, userId?: string): Promise<Category[]> {
    const snap = await this.col().get();
    return snap.docs
      .map((d) => this.docToCategory(d.id, d.data()))
      .filter(
        (c) =>
          (c.type === type || c.type === CategoryType.BOTH) &&
          (c.isDefault || (userId && c.userId === userId)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCustom(userId: string, data: Partial<Category>): Promise<Category> {
    const id = uuidv4();
    const now = new Date();
    const category: Category = {
      id,
      name: data.name!,
      icon: data.icon!,
      color: data.color!,
      type: data.type ?? CategoryType.EXPENSE,
      isDefault: false,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await this.col().doc(id).set(category);
    return category;
  }

  private async seedDefaultCategories(): Promise<void> {
    try {
      const snap = await this.col().where('isDefault', '==', true).limit(1).get();
      if (!snap.empty) return;

      const batch = this.firebase.firestore().batch();
      const now = new Date();

      DEFAULT_CATEGORIES.forEach((c) => {
        const id = uuidv4();
        const ref = this.col().doc(id);
        batch.set(ref, { id, ...c, isDefault: true, userId: null, createdAt: now, updatedAt: now });
      });

      await batch.commit();
      this.logger.log('Default categories seeded to Firestore');
    } catch (error) {
      this.logger.warn(`Skipping default category seed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
