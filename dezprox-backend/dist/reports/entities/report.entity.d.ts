import { Candidate } from '../../candidates/entities/candidate.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { Feedback } from './feedback.entity';
export declare class Report {
    id: string;
    candidateId: string;
    candidate: Candidate;
    assessmentId: string;
    assessment: Assessment;
    mcqPercentage: number;
    mcqCorrect: number;
    mcqTotal: number;
    mcqTopicBreakdown: Record<string, {
        correct: number;
        total: number;
        percentage: number;
    }>;
    typingWpm: number;
    typingAccuracy: number;
    codingManagerScore: number | null;
    codingAiScore: number | null;
    totalScore: number;
    isResultReleased: boolean;
    isShortlisted: boolean;
    recommendation: 'hire' | 'reject' | 'hold' | null;
    notes: string | null;
    generatedAt: Date;
    feedbacks: Feedback[];
}
