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
var AiEvaluationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiEvaluationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const ai_evaluation_service_1 = require("./ai-evaluation.service");
let AiEvaluationProcessor = AiEvaluationProcessor_1 = class AiEvaluationProcessor extends bullmq_1.WorkerHost {
    constructor(aiEvaluationService) {
        super();
        this.aiEvaluationService = aiEvaluationService;
        this.logger = new common_1.Logger(AiEvaluationProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing AI Evaluation job ${job.id} for candidate ${job.data.candidateId}`);
        try {
            await this.aiEvaluationService.processEvaluation(job.data.candidateId, job.data.force);
            this.logger.log(`Successfully processed AI Evaluation job ${job.id}`);
        }
        catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            const errStack = err instanceof Error ? err.stack : '';
            this.logger.error(`Failed to process AI Evaluation job ${job.id}: ${errMsg}`, errStack);
            throw err;
        }
    }
};
exports.AiEvaluationProcessor = AiEvaluationProcessor;
exports.AiEvaluationProcessor = AiEvaluationProcessor = AiEvaluationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('ai-evaluation'),
    __metadata("design:paramtypes", [ai_evaluation_service_1.AiEvaluationService])
], AiEvaluationProcessor);
//# sourceMappingURL=ai-evaluation.processor.js.map