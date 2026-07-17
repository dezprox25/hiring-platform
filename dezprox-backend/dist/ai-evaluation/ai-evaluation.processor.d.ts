import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiEvaluationService } from './ai-evaluation.service';
export declare class AiEvaluationProcessor extends WorkerHost {
    private readonly aiEvaluationService;
    private readonly logger;
    constructor(aiEvaluationService: AiEvaluationService);
    process(job: Job<any, any, string>): Promise<any>;
}
