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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    constructor() {
        this.registry = new prom_client_1.Registry();
        this.registry.setDefaultLabels({
            app: 'dezprox-backend',
        });
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status'],
            registers: [this.registry],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route'],
            buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
            registers: [this.registry],
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: 'websocket_active_connections',
            help: 'Number of active WebSocket connections',
            registers: [this.registry],
        });
        this.authFailuresTotal = new prom_client_1.Counter({
            name: 'auth_failures_total',
            help: 'Total number of authentication failures',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.websocketEventsTotal = new prom_client_1.Counter({
            name: 'websocket_events_total',
            help: 'Total number of WebSocket events',
            labelNames: ['event', 'type'],
            registers: [this.registry],
        });
        this.aiEvaluationDuration = new prom_client_1.Histogram({
            name: 'ai_evaluation_duration_seconds',
            help: 'Duration of AI evaluations in seconds',
            buckets: [5, 10, 20, 30, 60, 120],
            registers: [this.registry],
        });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map