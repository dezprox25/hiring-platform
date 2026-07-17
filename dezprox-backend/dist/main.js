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
const config_1 = require("@nestjs/config");
const Sentry = __importStar(require("@sentry/nestjs"));
const profiling_node_1 = require("@sentry/profiling-node");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const metrics_interceptor_1 = require("./common/interceptors/metrics.interceptor");
const metrics_service_1 = require("./metrics/metrics.service");
const redis_io_adapter_1 = require("./redis/redis-io.adapter");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            (0, profiling_node_1.nodeProfilingIntegration)(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
    });
    const server = (0, express_1.default)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
    const configService = app.get(config_1.ConfigService);
    const metricsService = app.get(metrics_service_1.MetricsService);
    const isProd = process.env.NODE_ENV === 'production';
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: isProd ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:", "wss:"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        } : false,
        crossOriginEmbedderPolicy: false,
    }));
    const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor(), new metrics_interceptor_1.MetricsInterceptor(metricsService));
    const frontendUrl = configService.get('FRONTEND_URL');
    const isDev = configService.get('NODE_ENV') !== 'production';
    app.enableCors({
        origin: isDev ? true : frontendUrl,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization',
    });
    const port = configService.get('PORT', 4000);
    if (isProd) {
        logger.log('Production mode: Dev endpoints and stack traces disabled.');
    }
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`CORS enabled for: ${isDev ? 'Any (Development Mode)' : frontendUrl}`);
}
bootstrap();
//# sourceMappingURL=main.js.map