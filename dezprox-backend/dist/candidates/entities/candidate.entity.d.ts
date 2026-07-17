import { User } from '../../users/entities/user.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { CandidateStatus } from '../enums/candidate-status.enum';
import { Report } from '../../reports/entities/report.entity';
import { AiEvaluation } from '../../ai-evaluation/entities/ai-evaluation.entity';
export declare class Candidate {
    id: string;
    fullName: string;
    phone: string;
    roleApplied: string;
    status: CandidateStatus;
    notes: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    assessment: Assessment;
    report: Report;
    aiEvaluation: AiEvaluation;
}
