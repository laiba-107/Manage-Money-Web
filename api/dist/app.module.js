"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const Joi = __importStar(require("joi"));
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const budgets_module_1 = require("./modules/budgets/budgets.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const categories_module_1 = require("./modules/categories/categories.module");
const settings_module_1 = require("./modules/settings/settings.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const user_entity_1 = require("./modules/users/entities/user.entity");
const category_entity_1 = require("./modules/categories/entities/category.entity");
const transaction_entity_1 = require("./modules/transactions/entities/transaction.entity");
const budget_entity_1 = require("./modules/budgets/entities/budget.entity");
const notification_entity_1 = require("./modules/notifications/entities/notification.entity");
const setting_entity_1 = require("./modules/settings/entities/setting.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: Joi.object({
                    NODE_ENV: Joi.string()
                        .valid('development', 'production', 'test')
                        .default('development'),
                    PORT: Joi.number().default(3000),
                    DB_HOST: Joi.string().allow('', null).default('localhost'),
                    DB_PORT: Joi.number().default(5432),
                    DB_USERNAME: Joi.string().allow('', null).default('postgres'),
                    DB_PASSWORD: Joi.string().allow('', null).default('postgres'),
                    DB_NAME: Joi.string().allow('', null).default('manage_money'),
                    DB_SSL: Joi.string().allow('true', 'false', '1', '0', '', null).default('false'),
                    JWT_SECRET: Joi.string().allow('', null).default('manage_money_default_jwt_secret_key_32_chars_min'),
                    JWT_REFRESH_SECRET: Joi.string().allow('', null).default('manage_money_default_refresh_secret_32_chars'),
                    JWT_EXPIRES_IN: Joi.string().allow('', null).default('7d'),
                    JWT_REFRESH_EXPIRES_IN: Joi.string().allow('', null).default('30d'),
                    FRONTEND_URL: Joi.string().allow('', null).default('http://localhost:3000'),
                    ALLOWED_ORIGINS: Joi.string().allow('', null).default('http://localhost:3000,http://localhost:3001,http://localhost'),
                }),
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const sslVal = String(configService.get('DB_SSL') || '').toLowerCase();
                    const isSsl = sslVal === 'true' || sslVal === '1';
                    return {
                        type: 'postgres',
                        host: configService.get('DB_HOST') || 'localhost',
                        port: configService.get('DB_PORT') || 5432,
                        username: configService.get('DB_USERNAME') || 'postgres',
                        password: configService.get('DB_PASSWORD') || 'postgres',
                        database: configService.get('DB_NAME') || 'manage_money',
                        entities: [user_entity_1.User, category_entity_1.Category, transaction_entity_1.Transaction, budget_entity_1.Budget, notification_entity_1.Notification, setting_entity_1.Setting],
                        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
                        ssl: isSsl ? { rejectUnauthorized: false } : false,
                        logging: configService.get('NODE_ENV') === 'development',
                        cache: {
                            duration: 30000,
                        },
                        extra: {
                            max: 20,
                            idleTimeoutMillis: 30000,
                            connectionTimeoutMillis: 5000,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('THROTTLE_TTL', 60) * 1000,
                        limit: configService.get('THROTTLE_LIMIT', 100),
                    },
                ],
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            transactions_module_1.TransactionsModule,
            budgets_module_1.BudgetsModule,
            analytics_module_1.AnalyticsModule,
            categories_module_1.CategoriesModule,
            settings_module_1.SettingsModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map