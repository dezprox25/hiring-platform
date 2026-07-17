import { Assessment } from './assessment.entity';
import { Question } from './question.entity';
import { ProgrammingLanguage } from '../enums/programming-language.enum';
export declare class CodingSubmission {
    id: string;
    assessmentId: string;
    assessment: Assessment;
    questionId: string;
    question: Question;
    code: string;
    language: ProgrammingLanguage;
    timeTakenSeconds: number;
    draftCode: string | null;
    managerScore: number | null;
    managerFeedback: string | null;
    managerReviewedAt: Date | null;
    aiScore: number | null;
    aiAnalysis: {
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
    } | null;
    aiAnalysedAt: Date | null;
    submittedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
