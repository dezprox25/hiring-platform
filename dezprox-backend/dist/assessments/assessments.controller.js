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
exports.AssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const assessments_service_1 = require("./assessments.service");
const mcq_service_1 = require("./mcq.service");
const typing_service_1 = require("./typing.service");
const coding_service_1 = require("./coding.service");
const submit_mcq_dto_1 = require("./dto/submit-mcq.dto");
const submit_typing_dto_1 = require("./dto/submit-typing.dto");
const submit_coding_dto_1 = require("./dto/submit-coding.dto");
const autosave_coding_dto_1 = require("./dto/autosave-coding.dto");
const manager_review_dto_1 = require("./dto/manager-review.dto");
const permissions_constant_1 = require("../common/constants/permissions.constant");
let AssessmentsController = class AssessmentsController {
    constructor(assessmentsService, mcqService, typingService, codingService) {
        this.assessmentsService = assessmentsService;
        this.mcqService = mcqService;
        this.typingService = typingService;
        this.codingService = codingService;
    }
    async start(id, user) {
        return this.assessmentsService.start(id, user);
    }
    async getStatus(id, user) {
        return this.assessmentsService.getStatus(id, user);
    }
    async getMcqQuestions(id, user) {
        return this.mcqService.getQuestions(id, user);
    }
    async submitMcq(id, dto, user) {
        return this.mcqService.submitAnswers(id, dto, user);
    }
    async getTypingPassage(id, user) {
        return this.typingService.getPassage(id, user);
    }
    async submitTyping(id, dto, user) {
        return this.typingService.submitTyping(id, dto, user);
    }
    async getCodingQuestion(id, user) {
        return this.codingService.getQuestion(id, user);
    }
    async autosaveCoding(id, dto, user) {
        return this.codingService.autosave(id, dto, user);
    }
    async submitCoding(id, dto, user) {
        return this.codingService.submitCoding(id, dto, user);
    }
    async addManagerReview(id, dto, user) {
        return this.codingService.addManagerReview(id, dto, user);
    }
    async getCodingSubmission(id, user) {
        return this.codingService.getSubmission(id, user);
    }
};
exports.AssessmentsController = AssessmentsController;
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "start", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ALL_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id/mcq/questions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "getMcqQuestions", null);
__decorate([
    (0, common_1.Post)(':id/mcq/submit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_mcq_dto_1.SubmitMcqDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "submitMcq", null);
__decorate([
    (0, common_1.Get)(':id/typing/passage'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "getTypingPassage", null);
__decorate([
    (0, common_1.Post)(':id/typing/submit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_typing_dto_1.SubmitTypingDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "submitTyping", null);
__decorate([
    (0, common_1.Get)(':id/coding/question'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "getCodingQuestion", null);
__decorate([
    (0, common_1.Post)(':id/coding/autosave'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, autosave_coding_dto_1.AutosaveCodingDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "autosaveCoding", null);
__decorate([
    (0, common_1.Post)(':id/coding/submit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CANDIDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_coding_dto_1.SubmitCodingDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "submitCoding", null);
__decorate([
    (0, common_1.Post)(':id/coding/review'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manager_review_dto_1.ManagerReviewDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "addManagerReview", null);
__decorate([
    (0, common_1.Get)(':id/coding/submission'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ALL_STAFF),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssessmentsController.prototype, "getCodingSubmission", null);
exports.AssessmentsController = AssessmentsController = __decorate([
    (0, common_1.Controller)('assessments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService,
        mcq_service_1.McqService,
        typing_service_1.TypingService,
        coding_service_1.CodingService])
], AssessmentsController);
//# sourceMappingURL=assessments.controller.js.map