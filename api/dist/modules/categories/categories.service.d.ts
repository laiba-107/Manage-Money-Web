import { OnApplicationBootstrap } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Category, CategoryType } from './entities/category.entity';
export declare class CategoriesService implements OnApplicationBootstrap {
    private readonly firebase;
    private readonly logger;
    constructor(firebase: FirebaseService);
    onApplicationBootstrap(): Promise<void>;
    private col;
    private docToCategory;
    findAll(userId?: string): Promise<Category[]>;
    findByType(type: CategoryType, userId?: string): Promise<Category[]>;
    createCustom(userId: string, data: Partial<Category>): Promise<Category>;
    private seedDefaultCategories;
}
