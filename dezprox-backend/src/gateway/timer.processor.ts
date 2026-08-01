import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AssessmentsService } from '../assessments/assessments.service';
import { AssessmentGateway } from './assessment.gateway';
import { GatewayService } from './gateway.service';

@Processor('assessment-timer')
export class TimerProcessor extends WorkerHost {
  private readonly logger = new Logger(TimerProcessor.name);

  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly gateway: AssessmentGateway,
    private readonly gatewayService: GatewayService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { assessmentId, userId, round } = job.data;
    
    this.logger.log(`Processing timer check for assessment ${assessmentId}, round ${round}`);
    
    try {
      // Mock user for ownership bypass if needed, or use the actual user ID from job data
      const mockUser = { sub: userId, role: 'candidate' } as any;
      const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, mockUser);
      
      // If round has already changed or assessment is completed, skip
      if (assessment.status !== round) {
        this.logger.log(`Assessment ${assessmentId} round has already changed. Skipping force submit.`);
        return;
      }

      const remaining = this.gatewayService.getSecondsRemaining(assessment);

      if (remaining <= 0) {
        this.logger.warn(`Time is up for assessment ${assessmentId}. Triggering server-authoritative round advance and force submit.`);
        this.gateway.emitForceSubmit(assessmentId, round);
        // Server-authoritative transition: advance round on server immediately
        try {
          await this.assessmentsService.advanceRound(assessmentId);
        } catch (advanceErr) {
          const advMsg = advanceErr instanceof Error ? advanceErr.message : 'Unknown error';
          this.logger.warn(`Could not advance round automatically for ${assessmentId}: ${advMsg}`);
        }
      } else {
        // This shouldn't happen often if delay was calculated correctly, 
        // but could happen if server time drifted. Re-queue if needed.
        this.logger.log(`Assessment ${assessmentId} still has ${remaining}s left. Re-queueing check.`);
        const queue = (job as any).queue;
        await queue.add('check-timer', job.data, {
          delay: remaining * 1000,
          jobId: `timer-${assessmentId}-${round}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error in timer processor for ${assessmentId}: ${message}`);
      throw err;
    }
  }
}
