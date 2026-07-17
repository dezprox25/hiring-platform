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
exports.ReportsService = exports.SCORE_WEIGHTS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
const report_entity_1 = require("./entities/report.entity");
const assessment_entity_1 = require("../assessments/entities/assessment.entity");
const mcq_answer_entity_1 = require("../assessments/entities/mcq-answer.entity");
const typing_result_entity_1 = require("../assessments/entities/typing-result.entity");
const coding_submission_entity_1 = require("../assessments/entities/coding-submission.entity");
const candidate_entity_1 = require("../candidates/entities/candidate.entity");
const role_enum_1 = require("../common/enums/role.enum");
const ownership_helper_1 = require("../common/helpers/ownership.helper");
exports.SCORE_WEIGHTS = {
    MCQ_WEIGHT: 0.4,
    TYPING_WEIGHT: 0.2,
    CODING_WEIGHT: 0.4,
    TYPING_MAX_WPM: 80,
};
let ReportsService = class ReportsService {
    constructor(reportsRepository, assessmentsRepository, mcqAnswersRepository, typingResultsRepository, codingSubmissionsRepository, candidatesRepository, cacheManager) {
        this.reportsRepository = reportsRepository;
        this.assessmentsRepository = assessmentsRepository;
        this.mcqAnswersRepository = mcqAnswersRepository;
        this.typingResultsRepository = typingResultsRepository;
        this.codingSubmissionsRepository = codingSubmissionsRepository;
        this.candidatesRepository = candidatesRepository;
        this.cacheManager = cacheManager;
    }
    async generate(assessmentId) {
        return this.reportsRepository.manager.transaction(async (manager) => {
            return this.generateWithManager(assessmentId, manager);
        });
    }
    async generateWithManager(assessmentId, manager) {
        const existing = await manager.findOne(report_entity_1.Report, {
            where: { assessmentId },
        });
        if (existing)
            return existing;
        const assessment = await manager.findOne(assessment_entity_1.Assessment, {
            where: { id: assessmentId },
            relations: ['candidate', 'candidate.user'],
        });
        if (!assessment)
            throw new common_1.NotFoundException('Assessment not found');
        const mcqAnswers = await manager.find(mcq_answer_entity_1.McqAnswer, {
            where: { assessmentId },
        });
        const typingResult = await manager.findOne(typing_result_entity_1.TypingResult, {
            where: { assessmentId },
        });
        const codingSubmission = await manager.findOne(coding_submission_entity_1.CodingSubmission, {
            where: { assessmentId },
        });
        const mcqCorrect = mcqAnswers.filter((a) => a.isCorrect).length;
        const mcqTotal = mcqAnswers.length;
        const mcqPercentage = mcqTotal === 0 ? 0 : (mcqCorrect / mcqTotal) * 100;
        const topicBreakdown = {};
        mcqAnswers.forEach((answer) => {
            const category = answer.topic || 'General';
            if (!topicBreakdown[category]) {
                topicBreakdown[category] = { correct: 0, total: 0, percentage: 0 };
            }
            topicBreakdown[category].total += 1;
            if (answer.isCorrect) {
                topicBreakdown[category].correct += 1;
            }
        });
        Object.keys(topicBreakdown).forEach((category) => {
            const topic = topicBreakdown[category];
            topic.percentage = Number(((topic.correct / topic.total) * 100).toFixed(2));
        });
        const mcqContrib = mcqPercentage * exports.SCORE_WEIGHTS.MCQ_WEIGHT;
        const typingWpm = typingResult?.wpm ?? 0;
        const typingContrib = Math.min((typingWpm / exports.SCORE_WEIGHTS.TYPING_MAX_WPM) * 100, 100) * exports.SCORE_WEIGHTS.TYPING_WEIGHT;
        const codingFinalScore = this.calculateCodingFinalScore(codingSubmission);
        const codingContrib = (codingFinalScore ?? 0) * exports.SCORE_WEIGHTS.CODING_WEIGHT;
        const totalScore = Number((mcqContrib + typingContrib + codingContrib).toFixed(2));
        const report = manager.create(report_entity_1.Report, {
            candidateId: assessment.candidateId,
            assessmentId: assessment.id,
            mcqCorrect,
            mcqTotal,
            mcqPercentage: Number(mcqPercentage.toFixed(2)),
            mcqTopicBreakdown: topicBreakdown,
            typingWpm,
            typingAccuracy: typingResult?.accuracy ?? 0,
            codingManagerScore: codingSubmission?.managerScore ?? null,
            codingAiScore: codingSubmission?.aiScore ?? null,
            totalScore,
        });
        const saved = await manager.save(report);
        await this.cacheManager.del('analytics_dashboard');
        return saved;
    }
    async getReportEntityByCandidateId(candidateId) {
        const report = await this.reportsRepository.findOne({
            where: { candidateId },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    async recalculateScore(reportId) {
        const report = await this.reportsRepository.findOne({ where: { id: reportId } });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        const codingSubmission = await this.codingSubmissionsRepository.findOne({
            where: { assessmentId: report.assessmentId },
        });
        const codingFinalScore = this.calculateCodingFinalScore(codingSubmission);
        report.codingManagerScore = codingSubmission?.managerScore ?? null;
        report.codingAiScore = codingSubmission?.aiScore ?? null;
        const mcqContrib = report.mcqPercentage * exports.SCORE_WEIGHTS.MCQ_WEIGHT;
        const typingContrib = Math.min((report.typingWpm / exports.SCORE_WEIGHTS.TYPING_MAX_WPM) * 100, 100) * exports.SCORE_WEIGHTS.TYPING_WEIGHT;
        const codingContrib = (codingFinalScore ?? 0) * exports.SCORE_WEIGHTS.CODING_WEIGHT;
        report.totalScore = Number((mcqContrib + typingContrib + codingContrib).toFixed(2));
        return this.reportsRepository.save(report);
    }
    calculateCodingFinalScore(submission) {
        if (!submission)
            return null;
        const scores = [];
        if (submission.managerScore !== null)
            scores.push(submission.managerScore);
        if (submission.aiScore !== null)
            scores.push(submission.aiScore);
        if (scores.length === 0)
            return null;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    async findAll(filters, user) {
        const { roleApplied, isShortlisted, minScore, maxScore, page = 1, limit = 10 } = filters;
        const query = this.reportsRepository.createQueryBuilder('report')
            .leftJoinAndSelect('report.candidate', 'candidate')
            .leftJoinAndSelect('candidate.user', 'user');
        if (roleApplied) {
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        }
        if (isShortlisted !== undefined) {
            query.andWhere('report.isShortlisted = :isShortlisted', { isShortlisted });
        }
        if (minScore !== undefined) {
            query.andWhere('report.totalScore >= :minScore', { minScore });
        }
        if (maxScore !== undefined) {
            query.andWhere('report.totalScore <= :maxScore', { maxScore });
        }
        const [data, total] = await query
            .orderBy('report.totalScore', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            data: data.map(r => this.mapToResponse(r, user.role)),
            total,
        };
    }
    async findByCandidateId(candidateId, user) {
        const report = await this.reportsRepository.findOne({
            where: { candidateId },
            relations: ['candidate', 'candidate.user', 'assessment', 'feedbacks', 'feedbacks.user'],
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        (0, ownership_helper_1.assertOwnership)(user.sub, report.candidate.user.id, user.role);
        if (user.role === role_enum_1.Role.CANDIDATE && !report.isResultReleased) {
            throw new common_1.BadRequestException('Result not released yet');
        }
        return this.mapToResponse(report, user.role);
    }
    async releaseResult(reportId, dto, user) {
        const report = await this.reportsRepository.findOne({
            where: { id: reportId },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        report.isResultReleased = dto.released;
        return this.reportsRepository.save(report);
    }
    async toggleShortlist(reportId, isShortlisted) {
        const report = await this.reportsRepository.findOne({
            where: { id: reportId },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        report.isShortlisted = isShortlisted;
        const saved = await this.reportsRepository.save(report);
        await this.cacheManager.del('analytics_dashboard');
        return saved;
    }
    mapToResponse(report, role) {
        const response = { ...report };
        if (role === role_enum_1.Role.CANDIDATE) {
            delete response.codingManagerScore;
            delete response.isShortlisted;
        }
        return response;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(1, (0, typeorm_1.InjectRepository)(assessment_entity_1.Assessment)),
    __param(2, (0, typeorm_1.InjectRepository)(mcq_answer_entity_1.McqAnswer)),
    __param(3, (0, typeorm_1.InjectRepository)(typing_result_entity_1.TypingResult)),
    __param(4, (0, typeorm_1.InjectRepository)(coding_submission_entity_1.CodingSubmission)),
    __param(5, (0, typeorm_1.InjectRepository)(candidate_entity_1.Candidate)),
    __param(6, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ReportsService);
//# sourceMappingURL=reports.service.js.map