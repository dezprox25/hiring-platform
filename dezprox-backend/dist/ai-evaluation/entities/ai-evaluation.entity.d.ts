import { Candidate } from '../../candidates/entities/candidate.entity';
import { AiEvaluationStatus } from '../enums/ai-evaluation-status.enum';
import { Recommendation } from '../../reports/enums/recommendation.enum';
import { Assessment } from '../../assessments/entities/assessment.entity';
export declare class AiEvaluation {
    id: string;
    candidateId: string;
    candidate: Candidate;
    assessmentId: string;
    assessment: Assessment;
    status: AiEvaluationStatus;
    strengths: string[] | null;
    weaknesses: string[] | null;
    codingAnalysis: {
        logic: number;
        readability: number;
        structure: number;
    } | null;
    communicationAnalysis: {
        clarity: number;
        confidence: number;
    } | null;
    summary: string | null;
    recommendation: Recommendation | null;
    overallScore: number | null;
    rawResponse: string | null;
    errorMessage: string | null;
    lastEvaluatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
