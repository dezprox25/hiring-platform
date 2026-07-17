import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
            applicationsOverTime: import("./interfaces/analytics.interfaces").TrendPoint[];
            topicPerformance: {
                topic: string;
                score: number;
            }[];
            passFailRatio: import("./interfaces/analytics.interfaces").PieSlice[];
            scoresDistribution: import("./interfaces/analytics.interfaces").ScoreBucket[];
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
    getDashboardStats(filters: AnalyticsFilterDto): Promise<import("./interfaces/analytics.interfaces").DashboardStats>;
    getRadarData(candidateId: string): Promise<import("./interfaces/analytics.interfaces").RadarData>;
    getTopicBreakdown(filters: AnalyticsFilterDto): Promise<import("./interfaces/analytics.interfaces").ChartPoint[]>;
    getPassFailRatio(filters: AnalyticsFilterDto): Promise<import("./interfaces/analytics.interfaces").PieSlice[]>;
    getHiringTrends(filters: AnalyticsFilterDto): Promise<import("./interfaces/analytics.interfaces").TrendPoint[]>;
    getLeaderboard(filters: AnalyticsFilterDto): Promise<any[]>;
    getScoreDistribution(filters: AnalyticsFilterDto): Promise<import("./interfaces/analytics.interfaces").ScoreBucket[]>;
}
