import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckService, 
  TypeOrmHealthIndicator, 
  HealthCheck, 
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  private readonly startTime = new Date();

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private redisService: RedisService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      () => this.microservice.pingCheck('redis', {
        transport: 0 as any, // Placeholder for Redis indicator or custom logic
      }),
    ]);
  }

  @Public()
  @Get('liveness')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => Promise.resolve({ status: 'up' as const } as any),
    ]);
  }

  @Public()
  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Public()
  @Get('details')
  getDetails() {
    const uptimeSeconds = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
    return {
      status: 'ok',
      uptime: {
        seconds: uptimeSeconds,
        readable: this.getReadableUptime(uptimeSeconds),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getReadableUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  }
}
