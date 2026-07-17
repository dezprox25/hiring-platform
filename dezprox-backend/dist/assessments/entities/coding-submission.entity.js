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
exports.CodingSubmission = void 0;
const typeorm_1 = require("typeorm");
const assessment_entity_1 = require("./assessment.entity");
const question_entity_1 = require("./question.entity");
const programming_language_enum_1 = require("../enums/programming-language.enum");
let CodingSubmission = class CodingSubmission {
};
exports.CodingSubmission = CodingSubmission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CodingSubmission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'assessment_id' }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => assessment_entity_1.Assessment, (a) => a.codingSubmission, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_id' }),
    __metadata("design:type", assessment_entity_1.Assessment)
], CodingSubmission.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'question_id' }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", question_entity_1.Question)
], CodingSubmission.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: programming_language_enum_1.ProgrammingLanguage, default: programming_language_enum_1.ProgrammingLanguage.TYPESCRIPT }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'time_taken_seconds' }),
    __metadata("design:type", Number)
], CodingSubmission.prototype, "timeTakenSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'draft_code' }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "draftCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, name: 'manager_score' }),
    __metadata("design:type", Number)
], CodingSubmission.prototype, "managerScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'manager_feedback' }),
    __metadata("design:type", String)
], CodingSubmission.prototype, "managerFeedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'manager_reviewed_at' }),
    __metadata("design:type", Date)
], CodingSubmission.prototype, "managerReviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, name: 'ai_score' }),
    __metadata("design:type", Number)
], CodingSubmission.prototype, "aiScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, name: 'ai_analysis' }),
    __metadata("design:type", Object)
], CodingSubmission.prototype, "aiAnalysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'ai_analysed_at' }),
    __metadata("design:type", Date)
], CodingSubmission.prototype, "aiAnalysedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'submitted_at' }),
    __metadata("design:type", Date)
], CodingSubmission.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CodingSubmission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CodingSubmission.prototype, "updatedAt", void 0);
exports.CodingSubmission = CodingSubmission = __decorate([
    (0, typeorm_1.Entity)('coding_submissions')
], CodingSubmission);
//# sourceMappingURL=coding-submission.entity.js.map