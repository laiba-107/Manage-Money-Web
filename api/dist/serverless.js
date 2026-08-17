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
exports.default = handler;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
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
let isAppInitialized = false;
let initError = null;
const publicPathInDist = (0, path_1.join)(__dirname, 'public');
const publicPathParent = (0, path_1.join)(__dirname, '..', 'public');
const publicPathRoot = (0, path_1.join)(__dirname, '..', '..', 'public');
let publicPath = publicPathInDist;
if (fs.existsSync(publicPathInDist)) {
    publicPath = publicPathInDist;
}
else if (fs.existsSync(publicPathParent)) {
    publicPath = publicPathParent;
}
else if (fs.existsSync(publicPathRoot)) {
    publicPath = publicPathRoot;
}
server.use(express_1.default.static(publicPath, { index: 'index.html' }));
async function bootstrapServer() {
    if (isAppInitialized) {
        return server;
    }
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server), { bufferLogs: true, abortOnError: false });
        const configService = app.get(config_1.ConfigService);
        const allowedOrigins = (configService.get('ALLOWED_ORIGINS') ||
            'http://localhost:3000,http://localhost:3001,http://localhost').split(',');
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
        await app.init();
        isAppInitialized = true;
        initError = null;
    }
    catch (error) {
        initError = error;
        console.error('NestJS Serverless Init Error:', error?.message || error);
    }
    return server;
}
server.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        const indexPath = (0, path_1.join)(publicPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    next();
});
async function handler(req, res) {
    try {
        const expressApp = await bootstrapServer();
        if (!isAppInitialized && initError) {
            console.error('Serverless Initialization Failed:', initError);
            return res.status(500).json({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'Backend server failed to initialize.',
                details: initError?.message || String(initError),
                hint: 'Please check your Vercel Environment Variables (DB_HOST, DB_PASSWORD, DB_SSL, JWT_SECRET).',
            });
        }
        expressApp(req, res);
    }
    catch (error) {
        console.error('Vercel Serverless Invocation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                statusCode: 500,
                error: 'Serverless Function Execution Error',
                message: error?.message || String(error),
                hint: 'Please check your Vercel Environment Variables and function configuration.',
            });
        }
    }
}
//# sourceMappingURL=serverless.js.map