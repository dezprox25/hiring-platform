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
exports.CandidatesController = void 0;
const common_1 = require("@nestjs/common");
const candidates_service_1 = require("./candidates.service");
const create_candidate_dto_1 = require("./dto/create-candidate.dto");
const update_candidate_dto_1 = require("./dto/update-candidate.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const permissions_constant_1 = require("../common/constants/permissions.constant");
const candidate_status_enum_1 = require("./enums/candidate-status.enum");
let CandidatesController = class CandidatesController {
    constructor(candidatesService) {
        this.candidatesService = candidatesService;
    }
    create(createCandidateDto, user) {
        return this.candidatesService.create(createCandidateDto, user);
    }
    resendInvite(id) {
        return this.candidatesService.resendInvite(id);
    }
    findAll(status, roleApplied, search, page, limit, user) {
        return this.candidatesService.findAll({
            status,
            roleApplied,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        }, user);
    }
    findMe(user) {
        return this.candidatesService.findMe(user);
    }
    async getMyAssessment(user) {
        const candidate = await this.candidatesService.findMe(user);
        return { assessmentId: candidate.assessment?.id ?? null };
    }
    getMyResult() {
        return { message: 'Results not yet released', result: null };
    }
    findOne(id, user) {
        return this.candidatesService.findOne(id, user);
    }
    update(id, updateCandidateDto, user) {
        return this.candidatesService.update(id, updateCandidateDto, user);
    }
    updateStatus(id, updateStatusDto, user) {
        return this.candidatesService.updateStatus(id, updateStatusDto, user);
    }
    remove(id) {
        return this.candidatesService.softDelete(id);
    }
};
exports.CandidatesController = CandidatesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_HR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_candidate_dto_1.CreateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_HR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "resendInvite", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_HR_MANAGER),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('roleApplied')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findMe", null);
__decorate([
    (0, common_1.Get)('me/assessment'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "getMyAssessment", null);
__decorate([
    (0, common_1.Get)('me/result'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "getMyResult", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ALL_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_HR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_candidate_dto_1.UpdateCandidateDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_HR_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_ONLY),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "remove", null);
exports.CandidatesController = CandidatesController = __decorate([
    (0, common_1.Controller)('candidates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [candidates_service_1.CandidatesService])
], CandidatesController);
//# sourceMappingURL=candidates.controller.js.map