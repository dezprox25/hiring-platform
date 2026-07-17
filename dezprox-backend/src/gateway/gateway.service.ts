import { Injectable } from '@nestjs/common';
import { Assessment } from '../assessments/entities/assessment.entity';
import { AssessmentStatus } from '../assessments/enums/assessment-status.enum';
import { ASSESSMENT_ROUND_DURATIONS } from '../assessments/assessment.constants';

@Injectable()
export class GatewayService {
  /**
   * Returns the correct timestamp for the current round
   */
  getRoundStartedAt(assessment: Assessment, round: AssessmentStatus): Date | null {
    switch (round) {
      case AssessmentStatus.ROUND_1:
        return assessment.startedAt;
      case AssessmentStatus.ROUND_2:
        return assessment.round2StartedAt;
      case AssessmentStatus.ROUND_3:
        return assessment.round3StartedAt;
      default:
        return null;
    }
  }

  /**
   * Calculates the remaining seconds for the current round
   */
  getSecondsRemaining(assessment: Assessment): number {
    const round = assessment.status;
    const roundStartedAt = this.getRoundStartedAt(assessment, round);

    if (!roundStartedAt) {
      return 0;
    }

    let durationMinutes = 0;
    switch (round) {
      case AssessmentStatus.ROUND_1:
        durationMinutes = ASSESSMENT_ROUND_DURATIONS.mcq;
        break;
      case AssessmentStatus.ROUND_2:
        durationMinutes = ASSESSMENT_ROUND_DURATIONS.typing;
        break;
      case AssessmentStatus.ROUND_3:
        durationMinutes = ASSESSMENT_ROUND_DURATIONS.coding;
        break;
    }

    const durationSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - roundStartedAt.getTime()) / 1000);
    const secondsRemaining = durationSeconds - elapsedSeconds;

    return Math.max(0, secondsRemaining);
  }

  /**
   * Checks if the time for the current round has expired
   */
  isTimeUp(assessment: Assessment): boolean {
    return this.getSecondsRemaining(assessment) <= 0;
  }
}
