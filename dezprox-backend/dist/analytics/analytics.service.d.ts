import { Repository, DataSource } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { DashboardStats, RadarData, ChartPoint, PieSlice, TrendPoint, ScoreBucket } from './interfaces/analytics.interfaces';
export declare class AnalyticsService {
    private readonly dataSource;
    private readonly reportRepository;
    private readonly candidateRepository;
    private readonly assessmentRepository;
    constructor(dataSource: DataSource, reportRepository: Repository<Report>, candidateRepository: Repository<Candidate>, assessmentRepository: Repository<Assessment>);
    getDashboardStats(filters: AnalyticsFilterDto): Promise<DashboardStats>;
    getRadarData(candidateId: string): Promise<RadarData>;
    getTopicBreakdown(filters: AnalyticsFilterDto): Promise<ChartPoint[]>;
    getPassFailRatio(filters: AnalyticsFilterDto): Promise<PieSlice[]>;
    getHiringTrends(filters: AnalyticsFilterDto): Promise<TrendPoint[]>;
    getLeaderboard(filters: AnalyticsFilterDto): Promise<any[]>;
    getScoreDistribution(filters: AnalyticsFilterDto): Promise<ScoreBucket[]>;
    getHiringFunnel(filters: AnalyticsFilterDto): Promise<{
        stage: string;
        count: number;
    }[]>;
    getSkillRadarPool(filters: AnalyticsFilterDto): Promise<{
        skill: string;
        A: number;
        B: number;
    }[]>;
    private applyReportRoleFilter;
    getDashboardData(filters: AnalyticsFilterDto): Promise<{
        summary: {
            totalCandidates: number;
            activeAssessments: number;
            passed: number;
            rejected: number;
            shortlisted: number;
            hired: number;
            averageScore: number;
            passRate: number;
        };
        trends: {
            applicationsOverTime: TrendPoint[];
            topicPerformance: {
                topic: string;
                score: number;
            }[];
            passFailRatio: PieSlice[];
            scoresDistribution: ScoreBucket[];
            leaderboard: any[];
            funnel: {
                stage: string;
                count: number;
            }[];
            skillPool: {
                skill: string;
                A: number;
                B: number;
            }[];
        };
    }>;
}
