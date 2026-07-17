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
exports.Feedback = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const report_entity_1 = require("./report.entity");
const recommendation_enum_1 = require("../enums/recommendation.enum");
let Feedback = class Feedback {
};
exports.Feedback = Feedback;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Feedback.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Feedback.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => report_entity_1.Report, (r) => r.feedbacks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'report_id' }),
    __metadata("design:type", report_entity_1.Report)
], Feedback.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Feedback.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.feedbacks, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", user_entity_1.User)
], Feedback.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Feedback.prototype, "overallRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Feedback.prototype, "technicalComment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Feedback.prototype, "communicationComment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: recommendation_enum_1.Recommendation,
    }),
    __metadata("design:type", String)
], Feedback.prototype, "recommendation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Feedback.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Feedback.prototype, "updatedAt", void 0);
exports.Feedback = Feedback = __decorate([
    (0, typeorm_1.Entity)('feedbacks')
], Feedback);
//# sourceMappingURL=feedback.entity.js.map