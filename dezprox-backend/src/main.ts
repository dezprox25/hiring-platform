import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Sentry Initialization
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const configService = app.get(ConfigService);
  const metricsService = app.get(MetricsService);

  // Security: Helmet middleware for production headers
  const isProd = process.env.NODE_ENV === 'production';
  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"], // Allow secure sockets
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    } : false, // CSP can be noisy in dev with hot-reloading
    crossOriginEmbedderPolicy: false,
  }));

  // Redis Socket.IO Adapter
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global validation pipe with strict security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global response interceptor
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new MetricsInterceptor(metricsService),
  );

  // Enable CORS for frontend
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  
  app.enableCors({
    origin: isDev ? true : frontendUrl,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  const port = configService.get<number>('PORT', 4000);
  
  // Disable swagger/dev info in prod
  if (isProd) {
    logger.log('Production mode: Dev endpoints and stack traces disabled.');
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`CORS enabled for: ${isDev ? 'Any (Development Mode)' : frontendUrl}`);
}
bootstrap();
