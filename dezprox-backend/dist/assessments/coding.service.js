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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assessments_service_1 = require("./assessments.service");
const coding_submission_entity_1 = require("./entities/coding-submission.entity");
const question_entity_1 = require("./entities/question.entity");
const assessment_status_enum_1 = require("./enums/assessment-status.enum");
const question_type_enum_1 = require("./enums/question-type.enum");
const reports_service_1 = require("../reports/reports.service");
const ai_evaluation_service_1 = require("../ai-evaluation/ai-evaluation.service");
let CodingService = class CodingService {
    constructor(questionsRepository, codingSubmissionsRepository, assessmentsService, reportsService, aiEvaluationService) {
        this.questionsRepository = questionsRepository;
        this.codingSubmissionsRepository = codingSubmissionsRepository;
        this.assessmentsService = assessmentsService;
        this.reportsService = reportsService;
        this.aiEvaluationService = aiEvaluationService;
    }
    async getQuestion(assessmentId, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_3) {
            throw new common_1.BadRequestException('Coding round is not active');
        }
        const existingSubmission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId },
            relations: ['question'],
        });
        if (existingSubmission) {
            return existingSubmission.question;
        }
        const category = assessment.candidate.roleApplied;
        let question = await this.questionsRepository
            .createQueryBuilder('question')
            .where('question.type = :type', { type: question_type_enum_1.QuestionType.CODING })
            .andWhere('question.isActive = :isActive', { isActive: true })
            .andWhere('LOWER(question.category) = LOWER(:category)', { category })
            .orderBy('RANDOM()')
            .getOne();
        if (!question) {
            question = await this.questionsRepository
                .createQueryBuilder('question')
                .where('question.type = :type', { type: question_type_enum_1.QuestionType.CODING })
                .andWhere('question.isActive = :isActive', { isActive: true })
                .orderBy('RANDOM()')
                .getOne();
        }
        if (!question) {
            throw new common_1.NotFoundException('No coding questions available');
        }
        const submission = this.codingSubmissionsRepository.create({
            assessmentId,
            questionId: question.id,
            code: question.codeStarter || '',
        });
        await this.codingSubmissionsRepository.save(submission);
        return question;
    }
    async autosave(assessmentId, dto, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_3) {
            throw new common_1.BadRequestException('Coding round is not active');
        }
        const submission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId },
            relations: ['assessment'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Coding submission record not found');
        }
        submission.draftCode = dto.draftCode;
        await this.codingSubmissionsRepository.save(submission);
    }
    async submitCoding(assessmentId, dto, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_3) {
            throw new common_1.BadRequestException('Coding round is not active');
        }
        this.assessmentsService.validateTimeLimit(assessment, 'coding');
        const submission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId },
            relations: ['assessment'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Coding submission record not found');
        }
        submission.code = dto.code;
        submission.language = dto.language;
        submission.timeTakenSeconds = dto.timeTakenSeconds;
        submission.submittedAt = new Date();
        const savedSubmission = await this.codingSubmissionsRepository.save(submission);
        await this.assessmentsService.saveAssessment(assessment);
        await this.assessmentsService.advanceRound(assessmentId);
        this.aiEvaluationService.triggerEvaluation(assessment.candidateId);
        return savedSubmission;
    }
    async addManagerReview(assessmentId, dto, user) {
        const submission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId },
            relations: ['assessment'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Coding submission record not found');
        }
        submission.managerScore = dto.managerScore;
        submission.managerFeedback = dto.managerFeedback;
        submission.managerReviewedAt = new Date();
        const saved = await this.codingSubmissionsRepository.save(submission);
        try {
            const report = await this.reportsService.findByCandidateId(submission.assessment.candidateId, user);
            if (report) {
                await this.reportsService.recalculateScore(report.id);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.warn('Could not recalculate report score:', message);
        }
        return saved;
    }
    async getSubmission(assessmentId, user) {
        const submission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId },
            relations: ['question', 'assessment', 'assessment.candidate'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('Coding submission not found');
        }
        return submission;
    }
};
exports.CodingService = CodingService;
exports.CodingService = CodingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(coding_submission_entity_1.CodingSubmission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        assessments_service_1.AssessmentsService,
        reports_service_1.ReportsService,
        ai_evaluation_service_1.AiEvaluationService])
], CodingService);
//# sourceMappingURL=coding.service.js.map