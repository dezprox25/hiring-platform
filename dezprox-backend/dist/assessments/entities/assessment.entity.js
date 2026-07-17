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
exports.Assessment = void 0;
const typeorm_1 = require("typeorm");
const candidate_entity_1 = require("../../candidates/entities/candidate.entity");
const assessment_status_enum_1 = require("../enums/assessment-status.enum");
const coding_submission_entity_1 = require("./coding-submission.entity");
const mcq_answer_entity_1 = require("./mcq-answer.entity");
const typing_result_entity_1 = require("./typing-result.entity");
const report_entity_1 = require("../../reports/entities/report.entity");
const ai_evaluation_entity_1 = require("../../ai-evaluation/entities/ai-evaluation.entity");
let Assessment = class Assessment {
};
exports.Assessment = Assessment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Assessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', name: 'candidate_id' }),
    __metadata("design:type", String)
], Assessment.prototype, "candidateId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => candidate_entity_1.Candidate, (c) => c.assessment),
    (0, typeorm_1.JoinColumn)({ name: 'candidate_id' }),
    __metadata("design:type", candidate_entity_1.Candidate)
], Assessment.prototype, "candidate", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => coding_submission_entity_1.CodingSubmission, (c) => c.assessment, { cascade: true }),
    __metadata("design:type", coding_submission_entity_1.CodingSubmission)
], Assessment.prototype, "codingSubmission", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => mcq_answer_entity_1.McqAnswer, (a) => a.assessment, { cascade: true }),
    __metadata("design:type", Array)
], Assessment.prototype, "mcqAnswers", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => typing_result_entity_1.TypingResult, (t) => t.assessment, { cascade: true }),
    __metadata("design:type", typing_result_entity_1.TypingResult)
], Assessment.prototype, "typingResult", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => report_entity_1.Report, (r) => r.assessment),
    __metadata("design:type", report_entity_1.Report)
], Assessment.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ai_evaluation_entity_1.AiEvaluation, (a) => a.assessment),
    __metadata("design:type", ai_evaluation_entity_1.AiEvaluation)
], Assessment.prototype, "aiEvaluation", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 30,
        default: assessment_status_enum_1.AssessmentStatus.NOT_STARTED,
    }),
    __metadata("design:type", String)
], Assessment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'started_at' }),
    __metadata("design:type", Date)
], Assessment.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'round2_started_at' }),
    __metadata("design:type", Date)
], Assessment.prototype, "round2StartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'round3_started_at' }),
    __metadata("design:type", Date)
], Assessment.prototype, "round3StartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Date)
], Assessment.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Assessment.prototype, "createdAt", void 0);
exports.Assessment = Assessment = __decorate([
    (0, typeorm_1.Entity)('assessments')
], Assessment);
//# sourceMappingURL=assessment.entity.js.map