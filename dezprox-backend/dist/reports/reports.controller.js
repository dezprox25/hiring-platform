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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const reports_service_1 = require("./reports.service");
const feedback_service_1 = require("./feedback.service");
const release_result_dto_1 = require("./dto/release-result.dto");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
let ReportsController = class ReportsController {
    constructor(reportsService, feedbackService) {
        this.reportsService = reportsService;
        this.feedbackService = feedbackService;
    }
    async findMyReport(user) {
        return this.reportsService.findByCandidateId(user.sub, user);
    }
    async findAll(roleApplied, isShortlisted, minScore, maxScore, page, limit, user) {
        return this.reportsService.findAll({
            roleApplied,
            isShortlisted: isShortlisted === 'true' ? true : isShortlisted === 'false' ? false : undefined,
            minScore: minScore ? Number(minScore) : undefined,
            maxScore: maxScore ? Number(maxScore) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        }, user);
    }
    async findByCandidateId(candidateId, user) {
        return this.reportsService.findByCandidateId(candidateId, user);
    }
    async findById(id, user) {
        return this.reportsService.findById(id, user);
    }
    async releaseResult(id, dto, user) {
        return this.reportsService.releaseResult(id, dto, user);
    }
    async toggleShortlist(id, isShortlisted) {
        return this.reportsService.toggleShortlist(id, isShortlisted);
    }
    async addFeedback(id, dto, user) {
        return this.feedbackService.create(id, dto, user);
    }
    async getFeedback(id) {
        return this.feedbackService.findByReport(id);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findMyReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Query)('roleApplied')),
    __param(1, (0, common_1.Query)('isShortlisted')),
    __param(2, (0, common_1.Query)('minScore')),
    __param(3, (0, common_1.Query)('maxScore')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('candidate/:candidateId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('candidateId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findByCandidateId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/release'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, release_result_dto_1.ReleaseResultDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "releaseResult", null);
__decorate([
    (0, common_1.Patch)(':id/shortlist'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isShortlisted')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "toggleShortlist", null);
__decorate([
    (0, common_1.Post)(':id/feedback'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_feedback_dto_1.CreateFeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "addFeedback", null);
__decorate([
    (0, common_1.Get)(':id/feedback'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getFeedback", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        feedback_service_1.FeedbackService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map