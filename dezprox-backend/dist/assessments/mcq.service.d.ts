import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { SubmitMcqDto } from './dto/submit-mcq.dto';
import { McqAnswer } from './entities/mcq-answer.entity';
import { Question } from './entities/question.entity';
import { QuestionType } from './enums/question-type.enum';
import { McqQuestionService } from '../question-bank/mcq-question.service';
export interface CandidateMcqQuestion {
    id: string;
    type: QuestionType;
    category: string;
    difficulty: string;
    text: string;
    options: string[];
    codeStarter: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class McqService {
    private readonly questionsRepository;
    private readonly mcqAnswersRepository;
    private readonly assessmentsService;
    private cacheManager;
    private readonly mcqQuestionService;
    constructor(questionsRepository: Repository<Question>, mcqAnswersRepository: Repository<McqAnswer>, assessmentsService: AssessmentsService, cacheManager: Cache, mcqQuestionService: McqQuestionService);
    getQuestions(assessmentId: string, user: JwtPayload): Promise<CandidateMcqQuestion[]>;
    submitAnswers(assessmentId: string, dto: SubmitMcqDto, user: JwtPayload): Promise<{
        score: number;
        total: number;
        percentage: number;
    }>;
    private shuffle;
}
