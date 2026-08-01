import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { SubmitTypingDto } from './dto/submit-typing.dto';
import { TypingResult } from './entities/typing-result.entity';
import { Question } from './entities/question.entity';
export declare class TypingService {
    private readonly typingResultsRepository;
    private readonly questionsRepository;
    private readonly assessmentsService;
    private readonly defaultPassages;
    constructor(typingResultsRepository: Repository<TypingResult>, questionsRepository: Repository<Question>, assessmentsService: AssessmentsService);
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
