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
exports.ListCodingQuestionsDto = void 0;
const class_validator_1 = require("class-validator");
const difficulty_enum_1 = require("../enums/difficulty.enum");
const question_status_enum_1 = require("../enums/question-status.enum");
const programming_language_enum_1 = require("../../assessments/enums/programming-language.enum");
class ListCodingQuestionsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.ListCodingQuestionsDto = ListCodingQuestionsDto;
__decorate([
    (0, class_validator_1.IsEnum)(question_status_enum_1.QuestionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListCodingQuestionsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(programming_language_enum_1.ProgrammingLanguage),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListCodingQuestionsDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(difficulty_enum_1.Difficulty),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListCodingQuestionsDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ListCodingQuestionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ListCodingQuestionsDto.prototype, "limit", void 0);
//# sourceMappingURL=list-coding-questions.dto.js.map