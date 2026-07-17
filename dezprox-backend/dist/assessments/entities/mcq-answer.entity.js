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
exports.McqAnswer = void 0;
const typeorm_1 = require("typeorm");
const assessment_entity_1 = require("./assessment.entity");
let McqAnswer = class McqAnswer {
};
exports.McqAnswer = McqAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], McqAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assessment_id' }),
    __metadata("design:type", String)
], McqAnswer.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => assessment_entity_1.Assessment, (a) => a.mcqAnswers, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_id' }),
    __metadata("design:type", assessment_entity_1.Assessment)
], McqAnswer.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'question_id' }),
    __metadata("design:type", String)
], McqAnswer.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], McqAnswer.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'selected_option' }),
    __metadata("design:type", String)
], McqAnswer.prototype, "selectedOption", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_correct' }),
    __metadata("design:type", Boolean)
], McqAnswer.prototype, "isCorrect", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'answered_at' }),
    __metadata("design:type", Date)
], McqAnswer.prototype, "answeredAt", void 0);
exports.McqAnswer = McqAnswer = __decorate([
    (0, typeorm_1.Entity)('mcq_answers')
], McqAnswer);
//# sourceMappingURL=mcq-answer.entity.js.map