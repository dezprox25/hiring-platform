"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiEvaluationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const ai_evaluation_service_1 = require("./ai-evaluation.service");
const ai_evaluation_controller_1 = require("./ai-evaluation.controller");
const ai_evaluation_entity_1 = require("./entities/ai-evaluation.entity");
const coding_submission_entity_1 = require("../assessments/entities/coding-submission.entity");
const candidates_module_1 = require("../candidates/candidates.module");
const reports_module_1 = require("../reports/reports.module");
const openai_service_1 = require("./openai.service");
const ai_evaluation_processor_1 = require("./ai-evaluation.processor");
let AiEvaluationModule = class AiEvaluationModule {
};
exports.AiEvaluationModule = AiEvaluationModule;
exports.AiEvaluationModule = AiEvaluationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ai_evaluation_entity_1.AiEvaluation, coding_submission_entity_1.CodingSubmission]),
            bullmq_1.BullModule.registerQueue({
                name: 'ai-evaluation',
            }),
            (0, common_1.forwardRef)(() => candidates_module_1.CandidatesModule),
            reports_module_1.ReportsModule,
        ],
        providers: [ai_evaluation_service_1.AiEvaluationService, openai_service_1.OpenAiService, ai_evaluation_processor_1.AiEvaluationProcessor],
        controllers: [ai_evaluation_controller_1.AiEvaluationController],
        exports: [ai_evaluation_service_1.AiEvaluationService],
    })
], AiEvaluationModule);
//# sourceMappingURL=ai-evaluation.module.js.map