import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiEvaluationService } from './ai-evaluation.service';

@Processor('ai-evaluation')
export class AiEvaluationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiEvaluationProcessor.name);

  constructor(private readonly aiEvaluationService: AiEvaluationService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing AI Evaluation job ${job.id} for candidate ${job.data.candidateId}`);
    
    try {
      await this.aiEvaluationService.processEvaluation(job.data.candidateId, job.data.force);
      this.logger.log(`Successfully processed AI Evaluation job ${job.id}`);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const errStack = err instanceof Error ? err.stack : '';
      this.logger.error(`Failed to process AI Evaluation job ${job.id}: ${errMsg}`, errStack);
      throw err; // BullMQ will handle retries
    }
  }
}
