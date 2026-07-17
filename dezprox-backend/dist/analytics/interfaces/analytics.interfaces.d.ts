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
export interface RadarData {
    candidateId: string;
    candidateName: string;
    technical: number;
    problemSolving: number;
    communication: number;
    speed: number;
    accuracy: number;
}
export interface ChartPoint {
    label: string;
    value: number;
}
export interface PieSlice {
    label: string;
    value: number;
    percentage: number;
}
export interface TrendPoint {
    month: string;
    invited: number;
    hired: number;
    rejected: number;
}
export interface ScoreBucket {
    range: string;
    count: number;
    percentage: number;
}
