import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, SelectQueryBuilder } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { McqAnswer } from '../assessments/entities/mcq-answer.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import {
  DashboardStats,
  RadarData,
  ChartPoint,
  PieSlice,
  TrendPoint,
  ScoreBucket,
} from './interfaces/analytics.interfaces';
import { CandidateStatus } from '../candidates/enums/candidate-status.enum';
import { AssessmentStatus } from '../assessments/enums/assessment-status.enum';

const PASS_THRESHOLD = 60;
const TYPING_MAX_WPM = 80;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {}

  /**
   * Powers the main dashboard cards with high-level totals and averages.
   */
  async getDashboardStats(filters: AnalyticsFilterDto): Promise<DashboardStats> {
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

    const [
      totalCandidates,
      activeAssessments,
      passed,
      rejected,
      shortlisted,
      hired,
      avgScoreResult,
    ] = await Promise.all([
      baseQuery.getCount(),
      this.assessmentRepository.count({
        where: {
          status: In([
            AssessmentStatus.ROUND_1,
            AssessmentStatus.ROUND_2,
            AssessmentStatus.ROUND_3,
          ]),
        },
      }),
      reportQuery
        .clone()
        .andWhere('report.totalScore >= :threshold', { threshold: PASS_THRESHOLD })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('candidate.status = :status', { status: CandidateStatus.REJECTED })
        .getCount(),
      reportQuery
        .clone()
        .andWhere('report.isShortlisted = :isShortlisted', { isShortlisted: true })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('candidate.status = :status', { status: CandidateStatus.HIRED })
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

  /**
   * Powers the pentagon/radar chart for a specific candidate's profile.
   */
  async getRadarData(candidateId: string): Promise<RadarData> {
    const report = await this.reportRepository.findOne({
      where: { candidateId },
      relations: ['candidate'],
    });

    if (!report) {
      throw new NotFoundException('Report not found for this candidate');
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

  /**
   * Powers the topic-wise performance bar chart across the platform.
   */
  async getTopicBreakdown(filters: AnalyticsFilterDto): Promise<ChartPoint[]> {
    const { startDate, endDate, roleApplied } = filters;

    const query = this.dataSource
      .getRepository(McqAnswer)
      .createQueryBuilder('answer')
      .leftJoin('answer.assessment', 'assessment')
      .leftJoin('assessment.candidate', 'candidate')
      .select('answer.topic', 'label')
      .addSelect(
        'AVG(CASE WHEN answer.isCorrect THEN 100 ELSE 0 END)',
        'value',
      )
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) query.andWhere('candidate.createdAt >= :startDate', { startDate });
    if (endDate) query.andWhere('candidate.createdAt <= :endDate', { endDate });
    if (roleApplied) query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

    const results = await query
      .groupBy('answer.topic')
      .orderBy('value', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      label: r.label,
      value: Number(parseFloat(r.value).toFixed(1)),
    }));
  }

  /**
   * Powers the Pass/Fail/Pending pie chart.
   */
  async getPassFailRatio(filters: AnalyticsFilterDto): Promise<PieSlice[]> {
    const { startDate, endDate, roleApplied } = filters;

    const totalCandidatesQuery = this.candidateRepository
      .createQueryBuilder('candidate')
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) totalCandidatesQuery.andWhere('candidate.createdAt >= :startDate', { startDate });
    if (endDate) totalCandidatesQuery.andWhere('candidate.createdAt <= :endDate', { endDate });
    if (roleApplied) totalCandidatesQuery.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

    const totalCandidates = await totalCandidatesQuery.getCount();

    const reportQuery = this.reportRepository.createQueryBuilder('report');
    if (startDate) reportQuery.andWhere('report.generatedAt >= :startDate', { startDate });
    if (endDate) reportQuery.andWhere('report.generatedAt <= :endDate', { endDate });
    if (roleApplied) this.applyReportRoleFilter(reportQuery, roleApplied);

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

    const formatSlice = (label: string, value: number) => ({
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

  /**
   * Powers the monthly hiring trend line chart (Admin only).
   */
  async getHiringTrends(filters: AnalyticsFilterDto): Promise<TrendPoint[]> {
    const { roleApplied } = filters;

    // Last 12 months trend
    const months: TrendPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
      months.push({ month: monthStr, invited: 0, hired: 0, rejected: 0 });
    }

    const query = this.candidateRepository
      .createQueryBuilder('candidate')
      .select("TO_CHAR(candidate.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'invited')
      .addSelect(
        "COUNT(*) FILTER (WHERE candidate.status = 'hired')",
        'hired',
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE candidate.status = 'rejected')",
        'rejected',
      )
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('candidate.createdAt >= :minDate', {
        minDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      });

    if (roleApplied) query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

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

  /**
   * Powers the top 10 candidates leaderboard.
   */
  async getLeaderboard(filters: AnalyticsFilterDto): Promise<any[]> {
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

    if (startDate) query.andWhere('report.generatedAt >= :startDate', { startDate });
    if (endDate) query.andWhere('report.generatedAt <= :endDate', { endDate });
    if (roleApplied) query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

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

  /**
   * Powers the score distribution histogram.
   */
  async getScoreDistribution(filters: AnalyticsFilterDto): Promise<ScoreBucket[]> {
    const { startDate, endDate, roleApplied } = filters;

    const query = this.reportRepository.createQueryBuilder('report');
    if (startDate) query.andWhere('report.generatedAt >= :startDate', { startDate });
    if (endDate) query.andWhere('report.generatedAt <= :endDate', { endDate });
    if (roleApplied) this.applyReportRoleFilter(query, roleApplied);

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
      const count = reports.filter(
        (r) => r.score >= b.min && r.score <= b.max,
      ).length;
      return {
        range: b.range,
        count,
        percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
      };
    });
  }

  /**
   * Powers the hiring funnel bar chart.
   */
  async getHiringFunnel(filters: AnalyticsFilterDto) {
    const { startDate, endDate, roleApplied } = filters;
    const baseQuery = this.candidateRepository
      .createQueryBuilder('candidate')
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) baseQuery.andWhere('candidate.createdAt >= :startDate', { startDate });
    if (endDate) baseQuery.andWhere('candidate.createdAt <= :endDate', { endDate });
    if (roleApplied) baseQuery.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

    const counts = await baseQuery
      .select('candidate.status', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('candidate.status')
      .getRawMany();

    const allStages = [
      CandidateStatus.INVITED,
      CandidateStatus.ACTIVE,
      CandidateStatus.SUBMITTED,
      CandidateStatus.EVALUATED,
      CandidateStatus.HIRED,
      CandidateStatus.REJECTED,
    ];

    return allStages.map((s) => {
      const match = counts.find((c) => c.stage === s);
      return {
        stage: s.charAt(0).toUpperCase() + s.slice(1),
        count: match ? parseInt(match.count) : 0,
      };
    });
  }

  /**
   * Powers the average skill radar for the pool.
   */
  async getSkillRadarPool(filters: AnalyticsFilterDto) {
    const { startDate, endDate, roleApplied } = filters;
    const query = this.reportRepository
      .createQueryBuilder('report')
      .innerJoin('report.candidate', 'candidate')
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) query.andWhere('report.generatedAt >= :startDate', { startDate });
    if (endDate) query.andWhere('report.generatedAt <= :endDate', { endDate });
    if (roleApplied) query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });

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
      { skill: 'Accuracy', A: Number(parseFloat(result?.technical || 0).toFixed(1)), B: 78 }, // Reuse technical for accuracy mock
    ];
  }

  private applyReportRoleFilter(
    query: SelectQueryBuilder<Report>,
    roleApplied: string,
  ): SelectQueryBuilder<Report> {
    const hasCandidateJoin = query.expressionMap.joinAttributes.some(
      (join) => join.alias.name === 'reportCandidate',
    );
    if (!hasCandidateJoin) {
      query.innerJoin('report.candidate', 'reportCandidate');
    }
    return query.andWhere('reportCandidate.roleApplied = :roleApplied', { roleApplied });
  }

  /**
   * Consolidated dashboard data for the frontend.
   */
  async getDashboardData(filters: AnalyticsFilterDto) {
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
}
