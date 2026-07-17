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
exports.McqQuestion = void 0;
const typeorm_1 = require("typeorm");
const difficulty_enum_1 = require("../enums/difficulty.enum");
const question_status_enum_1 = require("../enums/question-status.enum");
const class_transformer_1 = require("class-transformer");
let McqQuestion = class McqQuestion {
};
exports.McqQuestion = McqQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], McqQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], McqQuestion.prototype, "questionText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true }),
    __metadata("design:type", Array)
], McqQuestion.prototype, "options", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], McqQuestion.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], McqQuestion.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], McqQuestion.prototype, "roleApplied", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: difficulty_enum_1.Difficulty,
        default: difficulty_enum_1.Difficulty.MEDIUM,
    }),
    __metadata("design:type", String)
], McqQuestion.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: question_status_enum_1.QuestionStatus,
        default: question_status_enum_1.QuestionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], McqQuestion.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], McqQuestion.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], McqQuestion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], McqQuestion.prototype, "updatedAt", void 0);
exports.McqQuestion = McqQuestion = __decorate([
    (0, typeorm_1.Entity)('mcq_questions')
], McqQuestion);
//# sourceMappingURL=mcq-question.entity.js.map