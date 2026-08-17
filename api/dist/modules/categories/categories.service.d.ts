import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
export declare class CategoriesService implements OnModuleInit {
    private categoryRepository;
    private readonly logger;
    constructor(categoryRepository: Repository<Category>);
    onModuleInit(): Promise<void>;
    findAll(userId?: string): Promise<Category[]>;
    findByType(type: CategoryType, userId?: string): Promise<Category[]>;
    createCustom(userId: string, data: Partial<Category>): Promise<Category>;
    private seedDefaultCategories;
}
