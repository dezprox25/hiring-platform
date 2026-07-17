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
exports.ListMcqQuestionsDto = void 0;
const class_validator_1 = require("class-validator");
const difficulty_enum_1 = require("../enums/difficulty.enum");
const question_status_enum_1 = require("../enums/question-status.enum");
class ListMcqQuestionsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.ListMcqQuestionsDto = ListMcqQuestionsDto;
__decorate([
    (0, class_validator_1.IsEnum)(question_status_enum_1.QuestionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListMcqQuestionsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListMcqQuestionsDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListMcqQuestionsDto.prototype, "roleApplied", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(difficulty_enum_1.Difficulty),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListMcqQuestionsDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ListMcqQuestionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ListMcqQuestionsDto.prototype, "limit", void 0);
//# sourceMappingURL=list-mcq-questions.dto.js.map