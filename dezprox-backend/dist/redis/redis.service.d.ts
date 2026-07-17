import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    getClient(): Redis;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    del(key: string): Promise<number>;
    ping(): Promise<string>;
}
