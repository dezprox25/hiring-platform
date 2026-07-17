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
exports.AiEvaluation = void 0;
const typeorm_1 = require("typeorm");
const candidate_entity_1 = require("../../candidates/entities/candidate.entity");
const ai_evaluation_status_enum_1 = require("../enums/ai-evaluation-status.enum");
const recommendation_enum_1 = require("../../reports/enums/recommendation.enum");
const assessment_entity_1 = require("../../assessments/entities/assessment.entity");
let AiEvaluation = class AiEvaluation {
};
exports.AiEvaluation = AiEvaluation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiEvaluation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'candidate_id' }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "candidateId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => candidate_entity_1.Candidate, (c) => c.aiEvaluation, { nullable: false, cascade: false }),
    (0, typeorm_1.JoinColumn)({ name: 'candidate_id' }),
    __metadata("design:type", candidate_entity_1.Candidate)
], AiEvaluation.prototype, "candidate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'assessment_id' }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => assessment_entity_1.Assessment, (a) => a.aiEvaluation, { nullable: false, cascade: false }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_id' }),
    __metadata("design:type", assessment_entity_1.Assessment)
], AiEvaluation.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ai_evaluation_status_enum_1.AiEvaluationStatus,
        default: ai_evaluation_status_enum_1.AiEvaluationStatus.PENDING,
    }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], AiEvaluation.prototype, "strengths", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], AiEvaluation.prototype, "weaknesses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiEvaluation.prototype, "codingAnalysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiEvaluation.prototype, "communicationAnalysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: recommendation_enum_1.Recommendation,
        nullable: true,
    }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "recommendation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AiEvaluation.prototype, "overallScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "rawResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AiEvaluation.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AiEvaluation.prototype, "lastEvaluatedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AiEvaluation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AiEvaluation.prototype, "updatedAt", void 0);
exports.AiEvaluation = AiEvaluation = __decorate([
    (0, typeorm_1.Entity)('ai_evaluations')
], AiEvaluation);
//# sourceMappingURL=ai-evaluation.entity.js.map