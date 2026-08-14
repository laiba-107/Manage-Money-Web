import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { User } from './modules/users/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Transaction } from './modules/transactions/entities/transaction.entity';
import { Budget } from './modules/budgets/entities/budget.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Setting } from './modules/settings/entities/setting.entity';

@Module({
  imports: [
    // Environment config with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SSL: Joi.string().valid('true', 'false').default('false'),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
        GOOGLE_CLIENT_ID: Joi.string().default('optional_google_client_id'),
        GOOGLE_CLIENT_SECRET: Joi.string().default('optional_google_client_secret'),
        GOOGLE_CALLBACK_URL: Joi.string().default('http://localhost:3000/api/v1/auth/google/callback'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001,http://localhost'),
      }),
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Category, Transaction, Budget, Notification, Setting],
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        ssl:
          configService.get('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        logging: configService.get('NODE_ENV') === 'development',
        cache: {
          duration: 30000, // 30 seconds query cache
        },
        extra: {
          max: 20, // connection pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

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
