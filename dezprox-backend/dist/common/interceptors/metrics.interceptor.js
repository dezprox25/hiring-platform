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
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const metrics_service_1 = require("../../metrics/metrics.service");
let MetricsInterceptor = class MetricsInterceptor {
    constructor(metricsService) {
        this.metricsService = metricsService;
        this.logger = new common_1.Logger('MetricsInterceptor');
    }
    intercept(context, next) {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const { method, url } = request;
        const now = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const response = httpContext.getResponse();
            const statusCode = response.statusCode;
            const duration = (Date.now() - now) / 1000;
            this.metricsService.httpRequestsTotal.inc({
                method,
                route: url,
                status: statusCode.toString(),
            });
            this.metricsService.httpRequestDuration.observe({ method, route: url }, duration);
            if (duration > 1) {
                this.logger.warn(`Slow request: ${method} ${url} took ${duration}s`);
            }
        }));
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsInterceptor);
//# sourceMappingURL=metrics.interceptor.js.map