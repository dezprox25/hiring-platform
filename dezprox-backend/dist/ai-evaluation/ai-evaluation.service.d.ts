import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { AiEvaluation } from './entities/ai-evaluation.entity';
import { AiEvaluationStatus } from './enums/ai-evaluation-status.enum';
import { CandidatesService } from '../candidates/candidates.service';
import { ReportsService } from '../reports/reports.service';
import { OpenAiService } from './openai.service';
import { RetriggerEvaluationDto } from './dto/retrigger-evaluation.dto';
import { MetricsService } from '../metrics/metrics.service';
import { AlertService } from '../common/alerts/alert.service';
export declare class AiEvaluationService {
    private readonly aiEvaluationRepository;
    private readonly codingSubmissionsRepository;
    private readonly candidatesService;
    private readonly reportsService;
    private readonly openAiService;
    private readonly metricsService;
    private readonly alertService;
    private readonly aiEvaluationQueue;
    private readonly logger;
    constructor(aiEvaluationRepository: Repository<AiEvaluation>, codingSubmissionsRepository: Repository<CodingSubmission>, candidatesService: CandidatesService, reportsService: ReportsService, openAiService: OpenAiService, metricsService: MetricsService, alertService: AlertService, aiEvaluationQueue: Queue);
    triggerEvaluation(candidateId: string, force?: boolean): Promise<void>;
    processEvaluation(candidateId: string, force?: boolean): Promise<void>;
    findByCandidateId(candidateId: string): Promise<AiEvaluation>;
    getStatus(candidateId: string): Promise<{
        status: AiEvaluationStatus;
    }>;
    retrigger(candidateId: string, dto: RetriggerEvaluationDto): Promise<{
        message: string;
    }>;
}
