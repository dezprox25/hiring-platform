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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../reports/entities/report.entity");
const candidate_entity_1 = require("../candidates/entities/candidate.entity");
const assessment_entity_1 = require("../assessments/entities/assessment.entity");
const mcq_answer_entity_1 = require("../assessments/entities/mcq-answer.entity");
const candidate_status_enum_1 = require("../candidates/enums/candidate-status.enum");
const assessment_status_enum_1 = require("../assessments/enums/assessment-status.enum");
const PASS_THRESHOLD = 60;
const TYPING_MAX_WPM = 80;
let AnalyticsService = class AnalyticsService {
    constructor(dataSource, reportRepository, candidateRepository, assessmentRepository) {
        this.dataSource = dataSource;
        this.reportRepository = reportRepository;
        this.candidateRepository = candidateRepository;
        this.assessmentRepository = assessmentRepository;
    }
    async getDashboardStats(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const baseQuery = this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        const reportQuery = this.reportRepository.createQueryBuilder('report');
        if (startDate) {
            baseQuery.andWhere('candidate.createdAt >= :startDate', { startDate });
            reportQuery.andWhere('report.generatedAt >= :startDate', { startDate });
        }
        if (endDate) {
            baseQuery.andWhere('candidate.createdAt <= :endDate', { endDate });
            reportQuery.andWhere('report.generatedAt <= :endDate', { endDate });
        }
        if (roleApplied) {
            baseQuery.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
            this.applyReportRoleFilter(reportQuery, roleApplied);
        }
        const [totalCandidates, activeAssessments, passed, rejected, shortlisted, hired, avgScoreResult,] = await Promise.all([
            baseQuery.getCount(),
            this.assessmentRepository.count({
                where: {
                    status: (0, typeorm_2.In)([
                        assessment_status_enum_1.AssessmentStatus.ROUND_1,
                        assessment_status_enum_1.AssessmentStatus.ROUND_2,
                        assessment_status_enum_1.AssessmentStatus.ROUND_3,
                    ]),
                },
            }),
            reportQuery
                .clone()
                .andWhere('report.totalScore >= :threshold', { threshold: PASS_THRESHOLD })
                .getCount(),
            baseQuery
                .clone()
                .andWhere('candidate.status = :status', { status: candidate_status_enum_1.CandidateStatus.REJECTED })
                .getCount(),
            reportQuery
                .clone()
                .andWhere('report.isShortlisted = :isShortlisted', { isShortlisted: true })
                .getCount(),
            baseQuery
                .clone()
                .andWhere('candidate.status = :status', { status: candidate_status_enum_1.CandidateStatus.HIRED })
                .getCount(),
            reportQuery
                .select('AVG(report.total_score)', 'avg')
                .getRawOne(),
        ]);
        const averageScore = parseFloat(avgScoreResult?.avg || 0);
        const passRate = totalCandidates > 0 ? (passed / totalCandidates) * 100 : 0;
        return {
            totalCandidates,
            activeAssessments,
            passed,
            rejected,
            shortlisted,
            hired,
            averageScore: Number(averageScore.toFixed(1)),
            passRate: Number(passRate.toFixed(1)),
        };
    }
    async getRadarData(candidateId) {
        const report = await this.reportRepository.findOne({
            where: { candidateId },
            relations: ['candidate'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found for this candidate');
        }
        const problemSolving = report.codingAiScore ?? report.codingManagerScore ?? 0;
        const speed = Math.min((report.typingWpm / TYPING_MAX_WPM) * 100, 100);
        const accuracy = report.mcqTotal > 0 ? (report.mcqCorrect / report.mcqTotal) * 100 : 0;
        return {
            candidateId: report.candidateId,
            candidateName: report.candidate?.fullName ?? '',
            technical: Number(Number(report.mcqPercentage).toFixed(1)),
            problemSolving: Number(Number(problemSolving).toFixed(1)),
            communication: Number(Number(report.typingAccuracy).toFixed(1)),
            speed: Number(speed.toFixed(1)),
            accuracy: Number(accuracy.toFixed(1)),
        };
    }
    async getTopicBreakdown(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const query = this.dataSource
            .getRepository(mcq_answer_entity_1.McqAnswer)
            .createQueryBuilder('answer')
            .leftJoin('answer.assessment', 'assessment')
            .leftJoin('assessment.candidate', 'candidate')
            .select('answer.topic', 'label')
            .addSelect('AVG(CASE WHEN answer.isCorrect THEN 100 ELSE 0 END)', 'value')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (startDate)
            query.andWhere('candidate.createdAt >= :startDate', { startDate });
        if (endDate)
            query.andWhere('candidate.createdAt <= :endDate', { endDate });
        if (roleApplied)
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const results = await query
            .groupBy('answer.topic')
            .orderBy('value', 'DESC')
            .getRawMany();
        return results.map((r) => ({
            label: r.label,
            value: Number(parseFloat(r.value).toFixed(1)),
        }));
    }
    async getPassFailRatio(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const totalCandidatesQuery = this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (startDate)
            totalCandidatesQuery.andWhere('candidate.createdAt >= :startDate', { startDate });
        if (endDate)
            totalCandidatesQuery.andWhere('candidate.createdAt <= :endDate', { endDate });
        if (roleApplied)
            totalCandidatesQuery.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const totalCandidates = await totalCandidatesQuery.getCount();
        const reportQuery = this.reportRepository.createQueryBuilder('report');
        if (startDate)
            reportQuery.andWhere('report.generatedAt >= :startDate', { startDate });
        if (endDate)
            reportQuery.andWhere('report.generatedAt <= :endDate', { endDate });
        if (roleApplied)
            this.applyReportRoleFilter(reportQuery, roleApplied);
        const [passedCount, failedCount] = await Promise.all([
            reportQuery
                .clone()
                .andWhere('report.totalScore >= :threshold', { threshold: PASS_THRESHOLD })
                .getCount(),
            reportQuery
                .clone()
                .andWhere('report.totalScore < :threshold', { threshold: PASS_THRESHOLD })
                .getCount(),
        ]);
        const pendingCount = totalCandidates - (passedCount + failedCount);
        const formatSlice = (label, value) => ({
            label,
            value,
            percentage: totalCandidates > 0 ? Number(((value / totalCandidates) * 100).toFixed(1)) : 0,
        });
        return [
            formatSlice('Passed', passedCount),
            formatSlice('Failed', failedCount),
            formatSlice('Pending', Math.max(0, pendingCount)),
        ];
    }
    async getHiringTrends(filters) {
        const { roleApplied } = filters;
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toISOString().substring(0, 7);
            months.push({ month: monthStr, invited: 0, hired: 0, rejected: 0 });
        }
        const query = this.candidateRepository
            .createQueryBuilder('candidate')
            .select("TO_CHAR(candidate.created_at, 'YYYY-MM')", 'month')
            .addSelect('COUNT(*)', 'invited')
            .addSelect("COUNT(*) FILTER (WHERE candidate.status = 'hired')", 'hired')
            .addSelect("COUNT(*) FILTER (WHERE candidate.status = 'rejected')", 'rejected')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('candidate.createdAt >= :minDate', {
            minDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        });
        if (roleApplied)
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const results = await query.groupBy('month').getRawMany();
        return months.map((m) => {
            const dbMatch = results.find((r) => r.month === m.month);
            if (dbMatch) {
                return {
                    month: m.month,
                    invited: parseInt(dbMatch.invited),
                    hired: parseInt(dbMatch.hired),
                    rejected: parseInt(dbMatch.rejected),
                };
            }
            return m;
        });
    }
    async getLeaderboard(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const query = this.reportRepository
            .createQueryBuilder('report')
            .innerJoin('report.candidate', 'candidate')
            .select([
            'report.candidate_id as "candidateId"',
            'candidate.full_name as "fullName"',
            'candidate.role_applied as "roleApplied"',
            'report.total_score as "totalScore"',
            'report.mcq_percentage as "mcqPercentage"',
            'report.typing_wpm as "typingWpm"',
            'report.is_shortlisted as "isShortlisted"',
            'candidate.status as "status"',
        ])
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (startDate)
            query.andWhere('report.generatedAt >= :startDate', { startDate });
        if (endDate)
            query.andWhere('report.generatedAt <= :endDate', { endDate });
        if (roleApplied)
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const results = await query
            .orderBy('report.totalScore', 'DESC')
            .limit(10)
            .getRawMany();
        return results.map((r, index) => ({
            rank: index + 1,
            ...r,
            totalScore: Number(parseFloat(r.totalScore).toFixed(1)),
            mcqPercentage: Number(parseFloat(r.mcqPercentage).toFixed(1)),
        }));
    }
    async getScoreDistribution(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const query = this.reportRepository.createQueryBuilder('report');
        if (startDate)
            query.andWhere('report.generatedAt >= :startDate', { startDate });
        if (endDate)
            query.andWhere('report.generatedAt <= :endDate', { endDate });
        if (roleApplied)
            this.applyReportRoleFilter(query, roleApplied);
        const reports = await query.select('report.total_score', 'score').getRawMany();
        const totalCount = reports.length;
        const buckets = [
            { range: '0-20', min: 0, max: 20 },
            { range: '21-40', min: 21, max: 40 },
            { range: '41-60', min: 41, max: 60 },
            { range: '61-80', min: 61, max: 80 },
            { range: '81-100', min: 81, max: 100 },
        ];
        return buckets.map((b) => {
            const count = reports.filter((r) => r.score >= b.min && r.score <= b.max).length;
            return {
                range: b.range,
                count,
                percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
            };
        });
    }
    async getHiringFunnel(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const baseQuery = this.candidateRepository
            .createQueryBuilder('candidate')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (startDate)
            baseQuery.andWhere('candidate.createdAt >= :startDate', { startDate });
        if (endDate)
            baseQuery.andWhere('candidate.createdAt <= :endDate', { endDate });
        if (roleApplied)
            baseQuery.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const counts = await baseQuery
            .select('candidate.status', 'stage')
            .addSelect('COUNT(*)', 'count')
            .groupBy('candidate.status')
            .getRawMany();
        const allStages = [
            candidate_status_enum_1.CandidateStatus.INVITED,
            candidate_status_enum_1.CandidateStatus.ACTIVE,
            candidate_status_enum_1.CandidateStatus.SUBMITTED,
            candidate_status_enum_1.CandidateStatus.EVALUATED,
            candidate_status_enum_1.CandidateStatus.HIRED,
            candidate_status_enum_1.CandidateStatus.REJECTED,
        ];
        return allStages.map((s) => {
            const match = counts.find((c) => c.stage === s);
            return {
                stage: s.charAt(0).toUpperCase() + s.slice(1),
                count: match ? parseInt(match.count) : 0,
            };
        });
    }
    async getSkillRadarPool(filters) {
        const { startDate, endDate, roleApplied } = filters;
        const query = this.reportRepository
            .createQueryBuilder('report')
            .innerJoin('report.candidate', 'candidate')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (startDate)
            query.andWhere('report.generatedAt >= :startDate', { startDate });
        if (endDate)
            query.andWhere('report.generatedAt <= :endDate', { endDate });
        if (roleApplied)
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        const result = await query
            .select('AVG(report.mcq_percentage)', 'technical')
            .addSelect('AVG(COALESCE(report.coding_ai_score, report.coding_manager_score, 0))', 'problemSolving')
            .addSelect('AVG(report.typing_accuracy)', 'communication')
            .addSelect('AVG(LEAST((report.typing_wpm / 80.0) * 100, 100))', 'speed')
            .getRawOne();
        return [
            { skill: 'Technical', A: Number(parseFloat(result?.technical || 0).toFixed(1)), B: 75 },
            { skill: 'Communication', A: Number(parseFloat(result?.communication || 0).toFixed(1)), B: 80 },
            { skill: 'Problem Solving', A: Number(parseFloat(result?.problemSolving || 0).toFixed(1)), B: 70 },
            { skill: 'Speed', A: Number(parseFloat(result?.speed || 0).toFixed(1)), B: 85 },
            { skill: 'Accuracy', A: Number(parseFloat(result?.technical || 0).toFixed(1)), B: 78 },
        ];
    }
    applyReportRoleFilter(query, roleApplied) {
        const hasCandidateJoin = query.expressionMap.joinAttributes.some((join) => join.alias.name === 'reportCandidate');
        if (!hasCandidateJoin) {
            query.innerJoin('report.candidate', 'reportCandidate');
        }
        return query.andWhere('reportCandidate.roleApplied = :roleApplied', { roleApplied });
    }
    async getDashboardData(filters) {
        const [stats, trends, topicBreakdown, passFail, distribution, leaderboard, funnel, skillPool] = await Promise.all([
            this.getDashboardStats(filters),
            this.getHiringTrends(filters),
            this.getTopicBreakdown(filters),
            this.getPassFailRatio(filters),
            this.getScoreDistribution(filters),
            this.getLeaderboard(filters),
            this.getHiringFunnel(filters),
            this.getSkillRadarPool(filters),
        ]);
        return {
            summary: {
                totalCandidates: stats.totalCandidates,
                activeAssessments: stats.activeAssessments,
                passed: stats.passed,
                rejected: stats.rejected,
                shortlisted: stats.shortlisted,
                hired: stats.hired,
                averageScore: stats.averageScore,
                passRate: stats.passRate,
            },
            trends: {
                applicationsOverTime: trends,
                topicPerformance: topicBreakdown.map(t => ({ topic: t.label, score: t.value })),
                passFailRatio: passFail,
                scoresDistribution: distribution,
                leaderboard,
                funnel,
                skillPool,
            },
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(2, (0, typeorm_1.InjectRepository)(candidate_entity_1.Candidate)),
    __param(3, (0, typeorm_1.InjectRepository)(assessment_entity_1.Assessment)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map