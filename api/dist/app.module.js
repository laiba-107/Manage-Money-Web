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
const Joi = __importStar(require("joi"));
const firebase_module_1 = require("./firebase/firebase.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const budgets_module_1 = require("./modules/budgets/budgets.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const categories_module_1 = require("./modules/categories/categories.module");
const settings_module_1 = require("./modules/settings/settings.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
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
                    FIREBASE_PROJECT_ID: Joi.string().allow('', null).optional(),
                    FIREBASE_CLIENT_EMAIL: Joi.string().allow('', null).optional(),
                    FIREBASE_PRIVATE_KEY: Joi.string().allow('', null).optional(),
                    JWT_SECRET: Joi.string().allow('', null).default('manage_money_default_jwt_secret_key_32_chars_min'),
                    JWT_REFRESH_SECRET: Joi.string().allow('', null).default('manage_money_default_refresh_secret_32_chars'),
                    JWT_EXPIRES_IN: Joi.string().allow('', null).default('7d'),
                    JWT_REFRESH_EXPIRES_IN: Joi.string().allow('', null).default('30d'),
                    FRONTEND_URL: Joi.string().allow('', null).default('http://localhost:3000'),
                    ALLOWED_ORIGINS: Joi.string().allow('', null).default('http://localhost:3000,http://localhost:3001,http://localhost'),
                }),
            }),
            firebase_module_1.FirebaseModule,
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