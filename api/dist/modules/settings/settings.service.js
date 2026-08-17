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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const setting_entity_1 = require("./entities/setting.entity");
const users_service_1 = require("../users/users.service");
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
    constructor(settingRepository, usersService) {
        this.settingRepository = settingRepository;
        this.usersService = usersService;
    }
    async getAll(userId) {
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
    async update(userId, key, value) {
        const existing = await this.settingRepository.findOne({
            where: { userId, key },
        });
        if (existing) {
            existing.value = value;
            await this.settingRepository.save(existing);
        }
        else {
            const setting = this.settingRepository.create({ userId, key, value });
            await this.settingRepository.save(setting);
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
    __param(0, (0, typeorm_1.InjectRepository)(setting_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map