import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessmentStatus } from '../assessments/enums/assessment-status.enum';
export declare class GatewayService {
    getRoundStartedAt(assessment: Assessment, round: AssessmentStatus): Date | null;
    getSecondsRemaining(assessment: Assessment): number;
    isTimeUp(assessment: Assessment): boolean;
}
