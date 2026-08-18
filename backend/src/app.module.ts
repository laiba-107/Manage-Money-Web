import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
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

    // Firebase (replaces PostgreSQL/TypeORM)
    FirebaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TransactionsModule,
    BudgetsModule,
    AnalyticsModule,
    CategoriesModule,
    SettingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
