import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { AutosaveCodingDto } from './dto/autosave-coding.dto';
import { SubmitCodingDto } from './dto/submit-coding.dto';
import { CodingSubmission } from './entities/coding-submission.entity';
import { Question } from './entities/question.entity';
import { ReportsService } from '../reports/reports.service';
import { ManagerReviewDto } from './dto/manager-review.dto';
import { AiEvaluationService } from '../ai-evaluation/ai-evaluation.service';
import { CodingQuestionService } from '../question-bank/coding-question.service';
export declare class CodingService {
    private readonly questionsRepository;
    private readonly codingSubmissionsRepository;
    private readonly assessmentsService;
    private readonly reportsService;
    private readonly aiEvaluationService;
    private readonly codingQuestionService;
    constructor(questionsRepository: Repository<Question>, codingSubmissionsRepository: Repository<CodingSubmission>, assessmentsService: AssessmentsService, reportsService: ReportsService, aiEvaluationService: AiEvaluationService, codingQuestionService: CodingQuestionService);
    getQuestion(assessmentId: string, user: JwtPayload): Promise<Question>;
    autosave(assessmentId: string, dto: AutosaveCodingDto, user: JwtPayload): Promise<void>;
    submitCoding(assessmentId: string, dto: SubmitCodingDto, user: JwtPayload): Promise<CodingSubmission>;
    addManagerReview(assessmentId: string, dto: ManagerReviewDto, user: JwtPayload): Promise<CodingSubmission>;
    getSubmission(assessmentId: string, user: JwtPayload): Promise<CodingSubmission>;
}
