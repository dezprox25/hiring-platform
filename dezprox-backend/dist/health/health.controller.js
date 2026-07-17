"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const redis_service_1 = require("../redis/redis.service");
let HealthController = class HealthController {
    constructor(health, db, memory, microservice, redisService) {
        this.health = health;
        this.db = db;
        this.memory = memory;
        this.microservice = microservice;
        this.redisService = redisService;
        this.startTime = new Date();
    }
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
            () => this.microservice.pingCheck('redis', {
                transport: 0,
            }),
        ]);
    }
    liveness() {
        return this.health.check([
            () => Promise.resolve({ status: 'up' }),
        ]);
    }
    readiness() {
        return this.health.check([
            () => this.db.pingCheck('database'),
        ]);
    }
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
    getReadableUptime(seconds) {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('liveness'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('readiness'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "readiness", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('details'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getDetails", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        terminus_1.MicroserviceHealthIndicator,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map