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
exports.QuestionBankController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const mcq_question_service_1 = require("./mcq-question.service");
const coding_question_service_1 = require("./coding-question.service");
const create_mcq_question_dto_1 = require("./dto/create-mcq-question.dto");
const update_mcq_question_dto_1 = require("./dto/update-mcq-question.dto");
const list_mcq_questions_dto_1 = require("./dto/list-mcq-questions.dto");
const create_coding_question_dto_1 = require("./dto/create-coding-question.dto");
const update_coding_question_dto_1 = require("./dto/update-coding-question.dto");
const list_coding_questions_dto_1 = require("./dto/list-coding-questions.dto");
const update_question_status_dto_1 = require("./dto/update-question-status.dto");
const permissions_constant_1 = require("../common/constants/permissions.constant");
let QuestionBankController = class QuestionBankController {
    constructor(mcqQuestionService, codingQuestionService) {
        this.mcqQuestionService = mcqQuestionService;
        this.codingQuestionService = codingQuestionService;
    }
    async createMcq(dto) {
        return this.mcqQuestionService.create(dto);
    }
    async bulkImportMcq(csvString) {
        return this.mcqQuestionService.bulkImport(csvString);
    }
    async findAllMcq(filters) {
        return this.mcqQuestionService.findAll(filters);
    }
    async findOneMcq(id) {
        return this.mcqQuestionService.findOneSafe(id);
    }
    async updateMcq(id, dto) {
        return this.mcqQuestionService.update(id, dto);
    }
    async toggleMcqStatus(id, dto) {
        return this.mcqQuestionService.toggleStatus(id, dto.status);
    }
    async deleteMcq(id) {
        return this.mcqQuestionService.softDelete(id);
    }
    async createCoding(dto) {
        return this.codingQuestionService.create(dto);
    }
    async findAllCoding(filters) {
        return this.codingQuestionService.findAll(filters);
    }
    async findOneCoding(id) {
        return this.codingQuestionService.findOne(id);
    }
    async updateCoding(id, dto) {
        return this.codingQuestionService.update(id, dto);
    }
    async toggleCodingStatus(id, dto) {
        return this.codingQuestionService.toggleStatus(id, dto.status);
    }
    async deleteCoding(id) {
        return this.codingQuestionService.softDelete(id);
    }
};
exports.QuestionBankController = QuestionBankController;
__decorate([
    (0, common_1.Post)('mcq'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mcq_question_dto_1.CreateMcqQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "createMcq", null);
__decorate([
    (0, common_1.Post)('mcq/bulk-import'),
    __param(0, (0, common_1.Body)('csv')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "bulkImportMcq", null);
__decorate([
    (0, common_1.Get)('mcq'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_mcq_questions_dto_1.ListMcqQuestionsDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "findAllMcq", null);
__decorate([
    (0, common_1.Get)('mcq/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "findOneMcq", null);
__decorate([
    (0, common_1.Patch)('mcq/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mcq_question_dto_1.UpdateMcqQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "updateMcq", null);
__decorate([
    (0, common_1.Patch)('mcq/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_question_status_dto_1.UpdateQuestionStatusDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "toggleMcqStatus", null);
__decorate([
    (0, common_1.Delete)('mcq/:id'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_ONLY),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "deleteMcq", null);
__decorate([
    (0, common_1.Post)('coding'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_coding_question_dto_1.CreateCodingQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "createCoding", null);
__decorate([
    (0, common_1.Get)('coding'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_coding_questions_dto_1.ListCodingQuestionsDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "findAllCoding", null);
__decorate([
    (0, common_1.Get)('coding/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "findOneCoding", null);
__decorate([
    (0, common_1.Patch)('coding/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_coding_question_dto_1.UpdateCodingQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "updateCoding", null);
__decorate([
    (0, common_1.Patch)('coding/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_question_status_dto_1.UpdateQuestionStatusDto]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "toggleCodingStatus", null);
__decorate([
    (0, common_1.Delete)('coding/:id'),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_ONLY),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionBankController.prototype, "deleteCoding", null);
exports.QuestionBankController = QuestionBankController = __decorate([
    (0, common_1.Controller)('question-bank'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...permissions_constant_1.ADMIN_MANAGER),
    __metadata("design:paramtypes", [mcq_question_service_1.McqQuestionService,
        coding_question_service_1.CodingQuestionService])
], QuestionBankController);
//# sourceMappingURL=question-bank.controller.js.map