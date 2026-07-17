"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assessments_controller_1 = require("./assessments.controller");
const assessments_service_1 = require("./assessments.service");
const mcq_service_1 = require("./mcq.service");
const typing_service_1 = require("./typing.service");
const coding_service_1 = require("./coding.service");
const assessment_entity_1 = require("./entities/assessment.entity");
const candidate_entity_1 = require("../candidates/entities/candidate.entity");
const question_entity_1 = require("./entities/question.entity");
const mcq_answer_entity_1 = require("./entities/mcq-answer.entity");
const typing_result_entity_1 = require("./entities/typing-result.entity");
const coding_submission_entity_1 = require("./entities/coding-submission.entity");
const reports_module_1 = require("../reports/reports.module");
const ai_evaluation_module_1 = require("../ai-evaluation/ai-evaluation.module");
const question_bank_module_1 = require("../question-bank/question-bank.module");
let AssessmentsModule = class AssessmentsModule {
};
exports.AssessmentsModule = AssessmentsModule;
exports.AssessmentsModule = AssessmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                assessment_entity_1.Assessment,
                candidate_entity_1.Candidate,
                question_entity_1.Question,
                mcq_answer_entity_1.McqAnswer,
                typing_result_entity_1.TypingResult,
                coding_submission_entity_1.CodingSubmission,
            ]),
            reports_module_1.ReportsModule,
            (0, common_1.forwardRef)(() => ai_evaluation_module_1.AiEvaluationModule),
            question_bank_module_1.QuestionBankModule,
        ],
        controllers: [assessments_controller_1.AssessmentsController],
        providers: [
            assessments_service_1.AssessmentsService,
            mcq_service_1.McqService,
            typing_service_1.TypingService,
            coding_service_1.CodingService,
        ],
        exports: [assessments_service_1.AssessmentsService, mcq_service_1.McqService, typing_service_1.TypingService, coding_service_1.CodingService],
    })
], AssessmentsModule);
//# sourceMappingURL=assessments.module.js.map