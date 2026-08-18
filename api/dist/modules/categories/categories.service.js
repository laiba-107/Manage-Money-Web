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
var CategoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const category_entity_1 = require("./entities/category.entity");
const uuid_1 = require("uuid");
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
    constructor(firebase) {
        this.firebase = firebase;
        this.logger = new common_1.Logger(CategoriesService_1.name);
    }
    async onApplicationBootstrap() {
        await this.seedDefaultCategories();
    }
    col() {
        return this.firebase.collection('categories');
    }
    docToCategory(id, data) {
        return {
            id,
            name: data.name,
            icon: data.icon,
            color: data.color,
            type: data.type ?? category_entity_1.CategoryType.EXPENSE,
            isDefault: data.isDefault ?? false,
            userId: data.userId ?? null,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
    }
    async findAll(userId) {
        const snap = await this.col().get();
        return snap.docs
            .map((d) => this.docToCategory(d.id, d.data()))
            .filter((c) => c.isDefault || (userId && c.userId === userId))
            .sort((a, b) => {
            if (a.type < b.type)
                return -1;
            if (a.type > b.type)
                return 1;
            return a.name.localeCompare(b.name);
        });
    }
    async findByType(type, userId) {
        const snap = await this.col().get();
        return snap.docs
            .map((d) => this.docToCategory(d.id, d.data()))
            .filter((c) => (c.type === type || c.type === category_entity_1.CategoryType.BOTH) &&
            (c.isDefault || (userId && c.userId === userId)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    async createCustom(userId, data) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const category = {
            id,
            name: data.name,
            icon: data.icon,
            color: data.color,
            type: data.type ?? category_entity_1.CategoryType.EXPENSE,
            isDefault: false,
            userId,
            createdAt: now,
            updatedAt: now,
        };
        await this.col().doc(id).set(category);
        return category;
    }
    async seedDefaultCategories() {
        try {
            const snap = await this.col().where('isDefault', '==', true).limit(1).get();
            if (!snap.empty)
                return;
            const batch = this.firebase.firestore().batch();
            const now = new Date();
            DEFAULT_CATEGORIES.forEach((c) => {
                const id = (0, uuid_1.v4)();
                const ref = this.col().doc(id);
                batch.set(ref, { id, ...c, isDefault: true, userId: null, createdAt: now, updatedAt: now });
            });
            await batch.commit();
            this.logger.log('Default categories seeded to Firestore');
        }
        catch (error) {
            this.logger.warn(`Skipping default category seed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = CategoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map