import { CategoriesService } from './categories.service';
import { CategoryType } from './entities/category.entity';
import { User } from '../users/entities/user.entity';
export declare class CategoriesController {
    private categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: User): Promise<{
        data: import("./entities/category.entity").Category[];
        message: string;
    }>;
    findByType(user: User, type: CategoryType): Promise<{
        data: import("./entities/category.entity").Category[];
        message: string;
    }>;
}
