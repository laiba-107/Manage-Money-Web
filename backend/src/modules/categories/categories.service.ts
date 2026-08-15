import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';

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
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  async findAll(userId?: string): Promise<Category[]> {
    const query = this.categoryRepository
      .createQueryBuilder('c')
      .where('c.isDefault = true')
      .orWhere('c.userId = :userId', { userId: userId || '' })
      .orderBy('c.type', 'ASC')
      .addOrderBy('c.name', 'ASC');

    return query.getMany();
  }

  async findByType(type: CategoryType, userId?: string): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('c')
      .where('c.type IN (:...types)', { types: [type, CategoryType.BOTH] })
      .andWhere('(c.isDefault = true OR c.userId = :userId)', {
        userId: userId || '',
      })
      .orderBy('c.name', 'ASC')
      .getMany();
  }

  async createCustom(userId: string, data: Partial<Category>): Promise<Category> {
    const category = this.categoryRepository.create({
      ...data,
      userId,
      isDefault: false,
    });
    return this.categoryRepository.save(category);
  }

  private async seedDefaultCategories(): Promise<void> {
    try {
      const count = await this.categoryRepository.count({ where: { isDefault: true } as any });
      if (count > 0) return;

      const categories = DEFAULT_CATEGORIES.map((c) =>
        this.categoryRepository.create({ ...c, isDefault: true }),
      );
      await this.categoryRepository.save(categories);
    } catch (error) {
      this.logger?.warn?.(`Skipping default category seed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
