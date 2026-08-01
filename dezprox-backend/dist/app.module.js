"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const setup_1 = require("@sentry/nestjs/setup");
const setup_2 = require("@sentry/nestjs/setup");
const nestjs_pino_1 = require("nestjs-pino");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const users_module_1 = require("./users/users.module");
const candidates_module_1 = require("./candidates/candidates.module");
const mail_module_1 = require("./mail/mail.module");
const assessments_module_1 = require("./assessments/assessments.module");
const reports_module_1 = require("./reports/reports.module");
const gateway_module_1 = require("./gateway/gateway.module");
const analytics_module_1 = require("./analytics/analytics.module");
const ai_evaluation_module_1 = require("./ai-evaluation/ai-evaluation.module");
const question_bank_module_1 = require("./question-bank/question-bank.module");
const database_module_1 = require("./database/database.module");
const health_module_1 = require("./health/health.module");
const metrics_module_1 = require("./metrics/metrics.module");
const queue_monitoring_module_1 = require("./metrics/queue-monitoring.module");
const alert_module_1 = require("./common/alerts/alert.module");
const redis_module_1 = require("./redis/redis.module");
const bullmq_1 = require("@nestjs/bullmq");
const cache_manager_1 = require("@nestjs/cache-manager");
const cache_manager_ioredis_yet_1 = require("cache-manager-ioredis-yet");
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const database_config_1 = __importDefault(require("./config/database.config"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            setup_1.SentryModule.forRoot(),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    customProps: (req, res) => ({
                        context: 'HTTP',
                    }),
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true } }
                        : undefined,
                    redact: {
                        paths: ['req.headers.authorization', 'req.body.password', 'req.body.token', 'req.body.refreshToken'],
                        remove: true,
                    },
                },
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [jwt_config_1.default, database_config_1.default],
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const host = configService.get('REDIS_HOST', 'localhost');
                    return {
                        store: await (0, cache_manager_ioredis_yet_1.redisStore)({
                            host,
                            port: configService.get('REDIS_PORT', 6379),
                            password: configService.get('REDIS_PASSWORD'),
                            db: configService.get('REDIS_DB', 0),
                            tls: host.includes('upstash.io') || configService.get('REDIS_TLS') === 'true' ? { rejectUnauthorized: false } : undefined,
                            ttl: 600,
                            maxRetriesPerRequest: null,
                        }),
                    };
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const host = configService.get('REDIS_HOST', 'localhost');
                    return {
                        connection: {
                            host,
                            port: configService.get('REDIS_PORT', 6379),
                            password: configService.get('REDIS_PASSWORD'),
                            db: configService.get('REDIS_DB', 0),
                            tls: host.includes('upstash.io') || configService.get('REDIS_TLS') === 'true' ? { rejectUnauthorized: false } : undefined,
                            maxRetriesPerRequest: null,
                        },
                    };
                },
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            candidates_module_1.CandidatesModule,
            mail_module_1.MailModule,
            assessments_module_1.AssessmentsModule,
            reports_module_1.ReportsModule,
            gateway_module_1.GatewayModule,
            analytics_module_1.AnalyticsModule,
            ai_evaluation_module_1.AiEvaluationModule,
            question_bank_module_1.QuestionBankModule,
            health_module_1.HealthModule,
            metrics_module_1.MetricsModule,
            queue_monitoring_module_1.QueueMonitoringModule,
            alert_module_1.AlertModule,
            redis_module_1.RedisModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: common_1.ClassSerializerInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: setup_2.SentryGlobalFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map