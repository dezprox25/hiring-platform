import { AiEvaluationService } from './ai-evaluation.service';
import { RetriggerEvaluationDto } from './dto/retrigger-evaluation.dto';
export declare class AiEvaluationController {
    private readonly aiEvaluationService;
    constructor(aiEvaluationService: AiEvaluationService);
    findByCandidateId(candidateId: string): Promise<import("./entities/ai-evaluation.entity").AiEvaluation>;
    getStatus(candidateId: string): Promise<{
        status: import("./enums/ai-evaluation-status.enum").AiEvaluationStatus;
    }>;
    retrigger(candidateId: string, dto: RetriggerEvaluationDto): Promise<{
        message: string;
    }>;
}
