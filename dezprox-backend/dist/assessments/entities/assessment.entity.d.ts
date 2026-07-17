import { Candidate } from '../../candidates/entities/candidate.entity';
import { AssessmentStatus } from '../enums/assessment-status.enum';
import { CodingSubmission } from './coding-submission.entity';
import { McqAnswer } from './mcq-answer.entity';
import { TypingResult } from './typing-result.entity';
import { Report } from '../../reports/entities/report.entity';
import { AiEvaluation } from '../../ai-evaluation/entities/ai-evaluation.entity';
export declare class Assessment {
    id: string;
    candidateId: string;
    candidate: Candidate;
    codingSubmission: CodingSubmission;
    mcqAnswers: McqAnswer[];
    typingResult: TypingResult;
    report: Report;
    aiEvaluation: AiEvaluation;
    status: AssessmentStatus;
    startedAt: Date | null;
    round2StartedAt: Date | null;
    round3StartedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
}
