export interface AiEvaluation {
  overallScore: number;
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
  codingAnalysis: {
    logic: number;
    readability: number;
    structure: number;
  };
  communicationAnalysis: {
    clarity: number;
    confidence: number;
  };
  summary?: string;
  generatedAt: string;
}

export interface ReportDetailResponse {
  id: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    roleApplied: string;
    status: string;
  };
  assessment: {
    id: string;
    date: string;
    duration: number;
    status: string;
  };
  scores: {
    total: number;
    mcq: {
      correct: number;
      total: number;
      percentage: number;
      breakdown: Record<string, { correct: number; total: number; percentage: number }>;
    };
    typing: {
      wpm: number;
      accuracy: number;
      mistakes: number;
    };
    coding: {
      language: string;
      score: number | null;
      aiScore: number | null;
    };
  };
  aiEvaluation: AiEvaluation | null;
  feedback: Array<{
    id: string;
    content: string;
    rating: number;
    recommendation?: string;
    manager: string;
    createdAt: string;
  }>;
  isShortlisted: boolean;
  isResultReleased: boolean;
  createdAt: string;
}

/** Summary row from `GET /analytics/dashboard` */
export interface DashboardStats {
  totalCandidates: number;
  activeAssessments: number;
  passed: number;
  rejected: number;
  shortlisted: number;
  hired: number;
  averageScore: number;
  passRate: number;
}

export interface TrendPoint {
  month: string;
  invited: number;
  hired: number;
  rejected: number;
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface LeaderboardEntry {
  rank: number;
  candidateId: string;
  fullName: string;
  roleApplied: string;
  totalScore: number;
  mcqPercentage: number;
  typingWpm?: number;
  isShortlisted: boolean;
  status?: string;
}

export interface TopicPerformancePoint {
  topic: string;
  score: number;
}

export interface AnalyticsDashboardPayload {
  summary: DashboardStats;
  trends: {
    applicationsOverTime: TrendPoint[];
    topicPerformance: TopicPerformancePoint[];
    passFailRatio: PieSlice[];
    scoresDistribution: { range: string; count: number; percentage: number }[];
    leaderboard: LeaderboardEntry[];
    funnel: FunnelStage[];
    skillPool: { skill: string; A: number; B: number }[];
  };
}

/** Display labels used in admin candidate table (derived from AI evaluation + score). */
export type AIRecommendationLabel = "Strong Hire" | "Hire" | "Maybe" | "No Hire";
