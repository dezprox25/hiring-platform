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
exports.TypingResult = void 0;
const typeorm_1 = require("typeorm");
const assessment_entity_1 = require("./assessment.entity");
let TypingResult = class TypingResult {
};
exports.TypingResult = TypingResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TypingResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, name: 'assessment_id' }),
    __metadata("design:type", String)
], TypingResult.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => assessment_entity_1.Assessment, (a) => a.typingResult, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_id' }),
    __metadata("design:type", assessment_entity_1.Assessment)
], TypingResult.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TypingResult.prototype, "passage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TypingResult.prototype, "typedText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'time_taken_seconds' }),
    __metadata("design:type", Number)
], TypingResult.prototype, "timeTakenSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], TypingResult.prototype, "wpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], TypingResult.prototype, "accuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TypingResult.prototype, "mistakes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TypingResult.prototype, "createdAt", void 0);
exports.TypingResult = TypingResult = __decorate([
    (0, typeorm_1.Entity)('typing_results')
], TypingResult);
//# sourceMappingURL=typing-result.entity.js.map