import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, MicroserviceHealthIndicator } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
export declare class HealthController {
    private health;
    private db;
    private memory;
    private microservice;
    private redisService;
    private readonly startTime;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, memory: MemoryHealthIndicator, microservice: MicroserviceHealthIndicator, redisService: RedisService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"redis"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"redis"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">>, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"redis"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_rss"> & import("@nestjs/terminus").HealthIndicatorResult<"memory_heap"> & import("@nestjs/terminus").HealthIndicatorResult<"database">>>>;
    liveness(): Promise<import("@nestjs/terminus").HealthCheckResult<any, Partial<any>, Partial<any>>>;
    readiness(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">>, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult<"database">>>>;
    getDetails(): {
        status: string;
        uptime: {
            seconds: number;
            readable: string;
        };
        timestamp: string;
    };
    private getReadableUptime;
}
