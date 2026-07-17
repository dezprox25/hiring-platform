import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CandidatesModule } from './candidates/candidates.module';
import { MailModule } from './mail/mail.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { ReportsModule } from './reports/reports.module';
import { GatewayModule } from './gateway/gateway.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiEvaluationModule } from './ai-evaluation/ai-evaluation.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { QueueMonitoringModule } from './metrics/queue-monitoring.module';
import { AlertModule } from './common/alerts/alert.module';
import { RedisModule } from './redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule.forRoot({
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
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, databaseConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          ttl: 600, // 10 minutes default TTL
          maxRetriesPerRequest: null,
        }),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CandidatesModule,
    MailModule,
    AssessmentsModule,
    ReportsModule,
    GatewayModule,
    AnalyticsModule,
    AiEvaluationModule,
    QuestionBankModule,
    HealthModule,
    MetricsModule,
    QueueMonitoringModule,
    AlertModule,
    RedisModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
