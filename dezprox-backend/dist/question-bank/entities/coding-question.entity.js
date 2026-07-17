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
exports.CodingQuestion = void 0;
const typeorm_1 = require("typeorm");
const difficulty_enum_1 = require("../enums/difficulty.enum");
const question_status_enum_1 = require("../enums/question-status.enum");
const programming_language_enum_1 = require("../../assessments/enums/programming-language.enum");
let CodingQuestion = class CodingQuestion {
};
exports.CodingQuestion = CodingQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CodingQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CodingQuestion.prototype, "prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: programming_language_enum_1.ProgrammingLanguage,
    }),
    __metadata("design:type", String)
], CodingQuestion.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: difficulty_enum_1.Difficulty,
        default: difficulty_enum_1.Difficulty.MEDIUM,
    }),
    __metadata("design:type", String)
], CodingQuestion.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: question_status_enum_1.QuestionStatus,
        default: question_status_enum_1.QuestionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], CodingQuestion.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CodingQuestion.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CodingQuestion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CodingQuestion.prototype, "updatedAt", void 0);
exports.CodingQuestion = CodingQuestion = __decorate([
    (0, typeorm_1.Entity)('coding_questions')
], CodingQuestion);
//# sourceMappingURL=coding-question.entity.js.map