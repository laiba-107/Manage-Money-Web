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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path_1 = require("path");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const server = (0, express_1.default)();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server), { bufferLogs: true });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const allowedOrigins = configService
        .get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost')
        .split(',');
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
    });
    const publicPathInDist = (0, path_1.join)(__dirname, 'public');
    const publicPathParent = (0, path_1.join)(__dirname, '..', 'public');
    const publicPath = fs.existsSync(publicPathInDist) ? publicPathInDist : publicPathParent;
    app.use(express_1.default.static(publicPath, { index: 'index.html' }));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            const indexPath = (0, path_1.join)(publicPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                return res.sendFile(indexPath);
            }
        }
        next();
    });
    app.enableVersioning({ type: common_1.VersioningType.URI });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_transform_interceptor_1.ResponseTransformInterceptor());
    if (nodeEnv !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Manage Money API')
            .setDescription('Production-grade Personal Finance Management REST API')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
            .addTag('auth', 'Authentication endpoints')
            .addTag('users', 'User management')
            .addTag('transactions', 'Income & expense transactions')
            .addTag('budgets', 'Budget management')
            .addTag('analytics', 'Financial analytics & reports')
            .addTag('categories', 'Transaction categories')
            .addTag('settings', 'User settings & preferences')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    if (process.env.VERCEL) {
        await app.init();
    }
    else {
        await app.listen(port);
        console.log(`\n🚀 Manage Money API running on: http://localhost:${port}/api/v1`);
        console.log(`📖 API Docs: http://localhost:${port}/api/docs\n`);
    }
}
bootstrap();
exports.default = server;
//# sourceMappingURL=main.js.map