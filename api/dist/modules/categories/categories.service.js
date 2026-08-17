"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CategoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./entities/category.entity");
const DEFAULT_CATEGORIES = [
    { name: 'Salary', icon: 'work', color: '#4CAF50', type: category_entity_1.CategoryType.INCOME },
    { name: 'Freelance', icon: 'laptop', color: '#2196F3', type: category_entity_1.CategoryType.INCOME },
    { name: 'Business', icon: 'business', color: '#9C27B0', type: category_entity_1.CategoryType.INCOME },
    { name: 'Investments', icon: 'trending_up', color: '#FF9800', type: category_entity_1.CategoryType.INCOME },
    { name: 'Other Income', icon: 'attach_money', color: '#00BCD4', type: category_entity_1.CategoryType.INCOME },
    { name: 'Food & Dining', icon: 'restaurant', color: '#F44336', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Transport', icon: 'directions_car', color: '#FF5722', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#795548', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Shopping', icon: 'shopping_bag', color: '#E91E63', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Rent & Housing', icon: 'home', color: '#607D8B', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Entertainment', icon: 'movie', color: '#9C27B0', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Healthcare', icon: 'local_hospital', color: '#F44336', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Education', icon: 'school', color: '#3F51B5', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Travel', icon: 'flight', color: '#00BCD4', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Savings', icon: 'savings', color: '#4CAF50', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Insurance', icon: 'security', color: '#FF9800', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Personal Care', icon: 'spa', color: '#E91E63', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Return & Refunds', icon: 'settings_backup_restore', color: '#14b8a6', type: category_entity_1.CategoryType.EXPENSE },
    { name: 'Other', icon: 'category', color: '#9E9E9E', type: category_entity_1.CategoryType.BOTH },
];
let CategoriesService = CategoriesService_1 = class CategoriesService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
        this.logger = new common_1.Logger(CategoriesService_1.name);
    }
    async onModuleInit() {
        await this.seedDefaultCategories();
    }
    async findAll(userId) {
        const query = this.categoryRepository
            .createQueryBuilder('c')
            .where('c.isDefault = true')
            .orWhere('c.userId = :userId', { userId: userId || '' })
            .orderBy('c.type', 'ASC')
            .addOrderBy('c.name', 'ASC');
        return query.getMany();
    }
    async findByType(type, userId) {
        return this.categoryRepository
            .createQueryBuilder('c')
            .where('c.type IN (:...types)', { types: [type, category_entity_1.CategoryType.BOTH] })
            .andWhere('(c.isDefault = true OR c.userId = :userId)', {
            userId: userId || '',
        })
            .orderBy('c.name', 'ASC')
            .getMany();
    }
    async createCustom(userId, data) {
        const category = this.categoryRepository.create({
            ...data,
            userId,
            isDefault: false,
        });
        return this.categoryRepository.save(category);
    }
    async seedDefaultCategories() {
        try {
            const count = await this.categoryRepository.count({ where: { isDefault: true } });
            if (count > 0)
                return;
            const categories = DEFAULT_CATEGORIES.map((c) => this.categoryRepository.create({ ...c, isDefault: true }));
            await this.categoryRepository.save(categories);
        }
        catch (error) {
            this.logger?.warn?.(`Skipping default category seed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = CategoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map