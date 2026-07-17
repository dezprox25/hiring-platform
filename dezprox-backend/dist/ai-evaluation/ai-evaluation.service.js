"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const Sentry = __importStar(require("@sentry/nestjs"));
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const coding_submission_entity_1 = require("../assessments/entities/coding-submission.entity");
const ai_evaluation_entity_1 = require("./entities/ai-evaluation.entity");
const ai_evaluation_status_enum_1 = require("./enums/ai-evaluation-status.enum");
const candidates_service_1 = require("../candidates/candidates.service");
const reports_service_1 = require("../reports/reports.service");
const openai_service_1 = require("./openai.service");
const evaluation_prompt_1 = require("./prompts/evaluation.prompt");
const role_enum_1 = require("../common/enums/role.enum");
const metrics_service_1 = require("../metrics/metrics.service");
const alert_service_1 = require("../common/alerts/alert.service");
let AiEvaluationService = AiEvaluationService_1 = class AiEvaluationService {
    constructor(aiEvaluationRepository, codingSubmissionsRepository, candidatesService, reportsService, openAiService, metricsService, alertService, aiEvaluationQueue) {
        this.aiEvaluationRepository = aiEvaluationRepository;
        this.codingSubmissionsRepository = codingSubmissionsRepository;
        this.candidatesService = candidatesService;
        this.reportsService = reportsService;
        this.openAiService = openAiService;
        this.metricsService = metricsService;
        this.alertService = alertService;
        this.aiEvaluationQueue = aiEvaluationQueue;
        this.logger = new common_1.Logger(AiEvaluationService_1.name);
    }
    async triggerEvaluation(candidateId, force = false) {
        this.logger.log(`Enqueuing AI evaluation for candidate ${candidateId}`);
        const existing = await this.aiEvaluationRepository.findOne({ where: { candidateId } });
        if (existing && existing.status === ai_evaluation_status_enum_1.AiEvaluationStatus.COMPLETED && !force) {
            return;
        }
        let evaluation = existing;
        if (!evaluation) {
            evaluation = this.aiEvaluationRepository.create({ candidateId });
        }
        evaluation.status = ai_evaluation_status_enum_1.AiEvaluationStatus.PENDING;
        evaluation.errorMessage = null;
        await this.aiEvaluationRepository.save(evaluation);
        await this.aiEvaluationQueue.add('evaluate', { candidateId, force }, {
            jobId: `ai-eval-${candidateId}`,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
        });
    }
    async processEvaluation(candidateId, force = false) {
        const startTime = Date.now();
        try {
            let evaluation = await this.aiEvaluationRepository.findOne({
                where: { candidateId },
            });
            if (!evaluation) {
                evaluation = this.aiEvaluationRepository.create({ candidateId });
            }
            evaluation.status = ai_evaluation_status_enum_1.AiEvaluationStatus.RUNNING;
            await this.aiEvaluationRepository.save(evaluation);
            this.logger.log(`Starting background AI evaluation for candidate ${candidateId}`);
            const mockStaffUser = { sub: 'system', role: role_enum_1.Role.ADMIN, email: 'system@dezprox.com' };
            const candidate = await this.candidatesService.findOne(candidateId, mockStaffUser);
            if (!candidate || !candidate.assessment) {
                throw new Error('Candidate or assessment not found');
            }
            const reportEntity = await this.reportsService.getReportEntityByCandidateId(candidateId);
            const codingSubmission = await this.codingSubmissionsRepository.findOne({
                where: { assessmentId: reportEntity.assessmentId },
                relations: ['question'],
            });
            const inputData = {
                candidateName: candidate.fullName,
                roleApplied: candidate.roleApplied,
                mcq: {
                    totalQuestions: reportEntity.mcqTotal,
                    correctAnswers: reportEntity.mcqCorrect,
                    percentage: Number(reportEntity.mcqPercentage),
                    topicBreakdown: reportEntity.mcqTopicBreakdown,
                },
                typing: {
                    wpm: reportEntity.typingWpm,
                    accuracy: Number(reportEntity.typingAccuracy),
                    timeTakenSeconds: 0,
                },
                coding: {
                    question: codingSubmission?.question?.text || 'N/A',
                    submittedCode: codingSubmission?.code || '',
                    language: codingSubmission?.language ? String(codingSubmission.language) : 'N/A',
                    managerScore: codingSubmission?.managerScore ?? null,
                    managerReview: codingSubmission?.managerFeedback ?? null,
                },
            };
            const { systemPrompt, userMessage } = (0, evaluation_prompt_1.buildEvaluationPrompt)(inputData);
            const gptResult = await this.openAiService.evaluate(systemPrompt, userMessage);
            evaluation.status = ai_evaluation_status_enum_1.AiEvaluationStatus.COMPLETED;
            evaluation.strengths = gptResult.strengths;
            evaluation.weaknesses = gptResult.weaknesses;
            evaluation.codingAnalysis = gptResult.codingAnalysis;
            evaluation.communicationAnalysis = gptResult.communicationAnalysis;
            evaluation.summary = gptResult.summary;
            evaluation.recommendation = gptResult.recommendation;
            evaluation.overallScore = gptResult.overallScore;
            evaluation.rawResponse = JSON.stringify(gptResult);
            evaluation.lastEvaluatedAt = new Date();
            await this.aiEvaluationRepository.save(evaluation);
            if (codingSubmission) {
                await this.codingSubmissionsRepository.update(codingSubmission.id, {
                    aiScore: gptResult.overallScore,
                    aiAnalysis: gptResult,
                    aiAnalysedAt: new Date(),
                });
            }
            await this.reportsService.recalculateScore(reportEntity.id);
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.aiEvaluationDuration.observe(duration);
            this.logger.log(`Background AI evaluation completed for ${candidateId} in ${duration}s`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            const stack = err instanceof Error ? err.stack : '';
            this.logger.error(`Background AI Evaluation failed for candidate ${candidateId}: ${message}`, stack);
            Sentry.captureException(err, { extra: { candidateId, force } });
            await this.alertService.sendAlert(`Background AI Evaluation Failure`, { candidateId, error: message });
            const evaluation = await this.aiEvaluationRepository.findOne({ where: { candidateId } });
            if (evaluation) {
                evaluation.status = ai_evaluation_status_enum_1.AiEvaluationStatus.FAILED;
                evaluation.errorMessage = message;
                await this.aiEvaluationRepository.save(evaluation);
            }
            throw err;
        }
    }
    async findByCandidateId(candidateId) {
        const evaluation = await this.aiEvaluationRepository.findOne({
            where: { candidateId },
        });
        if (!evaluation) {
            throw new common_1.NotFoundException('AI evaluation not found for this candidate');
        }
        const { rawResponse, errorMessage, ...safeEval } = evaluation;
        return safeEval;
    }
    async getStatus(candidateId) {
        const evaluation = await this.aiEvaluationRepository.findOne({
            where: { candidateId },
            select: ['status'],
        });
        if (!evaluation) {
            throw new common_1.NotFoundException('AI evaluation not found for this candidate');
        }
        return { status: evaluation.status };
    }
    async retrigger(candidateId, dto) {
        const existing = await this.aiEvaluationRepository.findOne({
            where: { candidateId },
        });
        if (existing && existing.status === ai_evaluation_status_enum_1.AiEvaluationStatus.COMPLETED && !dto.force) {
            throw new common_1.ConflictException('Evaluation already completed. Pass force=true to re-run.');
        }
        if (existing && dto.force) {
            existing.status = ai_evaluation_status_enum_1.AiEvaluationStatus.PENDING;
            existing.strengths = null;
            existing.weaknesses = null;
            existing.codingAnalysis = null;
            existing.communicationAnalysis = null;
            existing.summary = null;
            existing.recommendation = null;
            existing.overallScore = null;
            existing.rawResponse = null;
            existing.errorMessage = null;
            await this.aiEvaluationRepository.save(existing);
        }
        this.triggerEvaluation(candidateId, dto.force);
        return { message: 'Evaluation started' };
    }
};
exports.AiEvaluationService = AiEvaluationService;
exports.AiEvaluationService = AiEvaluationService = AiEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ai_evaluation_entity_1.AiEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(coding_submission_entity_1.CodingSubmission)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => candidates_service_1.CandidatesService))),
    __param(7, (0, bullmq_1.InjectQueue)('ai-evaluation')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        candidates_service_1.CandidatesService,
        reports_service_1.ReportsService,
        openai_service_1.OpenAiService,
        metrics_service_1.MetricsService,
        alert_service_1.AlertService,
        bullmq_2.Queue])
], AiEvaluationService);
//# sourceMappingURL=ai-evaluation.service.js.map