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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const users_service_1 = require("../users/users.service");
const uuid_1 = require("uuid");
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
let SettingsService = class SettingsService {
    constructor(firebase, usersService) {
        this.firebase = firebase;
        this.usersService = usersService;
    }
    col() {
        return this.firebase.collection('settings');
    }
    async getAll(userId) {
        const snap = await this.col().where('userId', '==', userId).get();
        const result = { ...DEFAULT_SETTINGS };
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
    async update(userId, key, value) {
        const snap = await this.col()
            .where('userId', '==', userId)
            .where('key', '==', key)
            .limit(1)
            .get();
        const now = new Date();
        if (!snap.empty) {
            await snap.docs[0].ref.update({ value, updatedAt: now });
        }
        else {
            const id = (0, uuid_1.v4)();
            await this.col().doc(id).set({ id, userId, key, value, createdAt: now, updatedAt: now });
        }
        if (key === 'currency') {
            await this.usersService.updateCurrency(userId, value);
        }
        else if (key === 'theme') {
            await this.usersService.updateTheme(userId, value);
        }
    }
    async updateMany(userId, updates) {
        await Promise.all(Object.entries(updates).map(([key, value]) => this.update(userId, key, value)));
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        users_service_1.UsersService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map