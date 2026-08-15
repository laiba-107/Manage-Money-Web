import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const server = express();
let isAppInitialized = false;

async function bootstrapServer() {
  if (isAppInitialized) {
    return server;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const allowedOrigins = (
    configService.get<string>('ALLOWED_ORIGINS') ||
    'http://localhost:3000,http://localhost:3001,http://localhost'
  ).split(',');

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Serve static files from public directory (frontend)
  const publicPathInDist = join(__dirname, 'public');
  const publicPathParent = join(__dirname, '..', 'public');
  const publicPath = fs.existsSync(publicPathInDist) ? publicPathInDist : publicPathParent;
  app.use(express.static(publicPath, { index: 'index.html' }));

  // Fallback non-API GET requests to index.html for SPA routing
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      const indexPath = join(publicPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  await app.init();
  isAppInitialized = true;
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    const expressApp = await bootstrapServer();
    expressApp(req, res);
  } catch (error: any) {
    console.error('Vercel Serverless Invocation Error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Serverless Function Execution Error',
      error: error?.message || String(error),
      detail: 'Please check your Vercel Environment Variables (DB_HOST, DB_PASSWORD, DB_SSL, JWT_SECRET).',
    });
  }
}
