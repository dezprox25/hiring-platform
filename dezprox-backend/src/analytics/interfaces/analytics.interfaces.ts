export interface DashboardStats {
  totalCandidates: number;
  activeAssessments: number;
  passed: number;
  rejected: number;
  shortlisted: number;
  hired: number;
  averageScore: number;
  passRate: number; // passed/totalCandidates * 100
}

export interface RadarData {
  candidateId: string;
  candidateName: string;
  technical: number; // mcqPercentage
  problemSolving: number; // codingAiScore ?? codingManagerScore ?? 0
  communication: number; // typingAccuracy
  speed: number; // Math.min(typingWpm / 80 * 100, 100)
  accuracy: number; // mcqCorrect/mcqTotal * 100
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
