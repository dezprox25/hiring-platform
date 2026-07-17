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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const analytics_service_1 = require("./analytics.service");
const analytics_filter_dto_1 = require("./dto/analytics-filter.dto");
const permissions_constant_1 = require("../common/constants/permissions.constant");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboardData(filters) {
        return this.analyticsService.getDashboardData(filters);
    }
    async getDashboardStats(filters) {
        return this.analyticsService.getDashboardStats(filters);
    }
    async getRadarData(candidateId) {
        return this.analyticsService.getRadarData(candidateId);
    }
    async getTopicBreakdown(filters) {
        return this.analyticsService.getTopicBreakdown(filters);
    }
    async getPassFailRatio(filters) {
        return this.analyticsService.getPassFailRatio(filters);
    }
    async getHiringTrends(filters) {
        return this.analyticsService.getHiringTrends(filters);
    }
    async getLeaderboard(filters) {
        return this.analyticsService.getLeaderboard(filters);
    }
    async getScoreDistribution(filters) {
        return this.analyticsService.getScoreDistribution(filters);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheKey)('analytics_dashboard'),
    (0, cache_manager_1.CacheTTL)(300),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(300),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('radar/:candidateId'),
    __param(0, (0, common_1.Param)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRadarData", null);
__decorate([
    (0, common_1.Get)('topics'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(600),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopicBreakdown", null);
__decorate([
    (0, common_1.Get)('pass-fail'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(600),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPassFailRatio", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(3600),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHiringTrends", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(600),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('scores/distribution'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, cache_manager_1.CacheTTL)(1200),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_filter_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getScoreDistribution", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ALL_STAFF),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map