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
exports.Report = void 0;
const typeorm_1 = require("typeorm");
const candidate_entity_1 = require("../../candidates/entities/candidate.entity");
const assessment_entity_1 = require("../../assessments/entities/assessment.entity");
const feedback_entity_1 = require("./feedback.entity");
let Report = class Report {
};
exports.Report = Report;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'candidate_id' }),
    __metadata("design:type", String)
], Report.prototype, "candidateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => candidate_entity_1.Candidate, (c) => c.report, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'candidate_id' }),
    __metadata("design:type", candidate_entity_1.Candidate)
], Report.prototype, "candidate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'assessment_id' }),
    __metadata("design:type", String)
], Report.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => assessment_entity_1.Assessment, (a) => a.report, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_id' }),
    __metadata("design:type", assessment_entity_1.Assessment)
], Report.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'mcq_percentage' }),
    __metadata("design:type", Number)
], Report.prototype, "mcqPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'mcq_correct' }),
    __metadata("design:type", Number)
], Report.prototype, "mcqCorrect", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'mcq_total' }),
    __metadata("design:type", Number)
], Report.prototype, "mcqTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {}, name: 'mcq_topic_breakdown' }),
    __metadata("design:type", Object)
], Report.prototype, "mcqTopicBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'typing_wpm' }),
    __metadata("design:type", Number)
], Report.prototype, "typingWpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'typing_accuracy' }),
    __metadata("design:type", Number)
], Report.prototype, "typingAccuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'coding_manager_score' }),
    __metadata("design:type", Number)
], Report.prototype, "codingManagerScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'coding_ai_score' }),
    __metadata("design:type", Number)
], Report.prototype, "codingAiScore", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'total_score' }),
    __metadata("design:type", Number)
], Report.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, name: 'is_result_released' }),
    __metadata("design:type", Boolean)
], Report.prototype, "isResultReleased", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ default: false, name: 'is_shortlisted' }),
    __metadata("design:type", Boolean)
], Report.prototype, "isShortlisted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "recommendation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'generated_at' }),
    __metadata("design:type", Date)
], Report.prototype, "generatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => feedback_entity_1.Feedback, (feedback) => feedback.report),
    __metadata("design:type", Array)
], Report.prototype, "feedbacks", void 0);
exports.Report = Report = __decorate([
    (0, typeorm_1.Entity)('reports')
], Report);
//# sourceMappingURL=report.entity.js.map