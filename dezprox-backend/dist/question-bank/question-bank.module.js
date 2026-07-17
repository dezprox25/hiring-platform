"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mcq_question_entity_1 = require("./entities/mcq-question.entity");
const coding_question_entity_1 = require("./entities/coding-question.entity");
const mcq_question_service_1 = require("./mcq-question.service");
const coding_question_service_1 = require("./coding-question.service");
const question_bank_controller_1 = require("./question-bank.controller");
let QuestionBankModule = class QuestionBankModule {
};
exports.QuestionBankModule = QuestionBankModule;
exports.QuestionBankModule = QuestionBankModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                mcq_question_entity_1.McqQuestion,
                coding_question_entity_1.CodingQuestion,
            ]),
        ],
        controllers: [question_bank_controller_1.QuestionBankController],
        providers: [
            mcq_question_service_1.McqQuestionService,
            coding_question_service_1.CodingQuestionService,
        ],
        exports: [
            mcq_question_service_1.McqQuestionService,
            coding_question_service_1.CodingQuestionService,
        ],
    })
], QuestionBankModule);
//# sourceMappingURL=question-bank.module.js.map