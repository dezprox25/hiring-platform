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
exports.Candidate = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const assessment_entity_1 = require("../../assessments/entities/assessment.entity");
const candidate_status_enum_1 = require("../enums/candidate-status.enum");
const report_entity_1 = require("../../reports/entities/report.entity");
const ai_evaluation_entity_1 = require("../../ai-evaluation/entities/ai-evaluation.entity");
let Candidate = class Candidate {
};
exports.Candidate = Candidate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Candidate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name' }),
    __metadata("design:type", String)
], Candidate.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'role_applied' }),
    __metadata("design:type", String)
], Candidate.prototype, "roleApplied", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 30,
        default: candidate_status_enum_1.CandidateStatus.INVITED,
    }),
    __metadata("design:type", String)
], Candidate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ default: false, name: 'is_deleted' }),
    __metadata("design:type", Boolean)
], Candidate.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Candidate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Candidate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (u) => u.candidate),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Candidate.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => assessment_entity_1.Assessment, (a) => a.candidate),
    __metadata("design:type", assessment_entity_1.Assessment)
], Candidate.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => report_entity_1.Report, (r) => r.candidate),
    __metadata("design:type", report_entity_1.Report)
], Candidate.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ai_evaluation_entity_1.AiEvaluation, (a) => a.candidate),
    __metadata("design:type", ai_evaluation_entity_1.AiEvaluation)
], Candidate.prototype, "aiEvaluation", void 0);
exports.Candidate = Candidate = __decorate([
    (0, typeorm_1.Entity)('candidates')
], Candidate);
//# sourceMappingURL=candidate.entity.js.map