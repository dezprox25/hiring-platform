import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { SubmitTypingDto } from './dto/submit-typing.dto';
import { TypingResult } from './entities/typing-result.entity';
export declare class TypingService {
    private readonly typingResultsRepository;
    private readonly assessmentsService;
    private readonly passages;
    constructor(typingResultsRepository: Repository<TypingResult>, assessmentsService: AssessmentsService);
    getPassage(assessmentId: string, user: JwtPayload): Promise<{
        passage: string;
    }>;
    calculateWpm(typedText: string, passage: string, timeTakenSeconds: number): {
        wpm: number;
        accuracy: number;
        mistakes: number;
    };
    submitTyping(assessmentId: string, dto: SubmitTypingDto, user: JwtPayload): Promise<TypingResult>;
    private resolvePassage;
}
