import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { McqService, CandidateMcqQuestion } from './mcq.service';
import { TypingService } from './typing.service';
import { CodingService } from './coding.service';
import { SubmitMcqDto } from './dto/submit-mcq.dto';
import { SubmitTypingDto } from './dto/submit-typing.dto';
import { SubmitCodingDto } from './dto/submit-coding.dto';
import { AutosaveCodingDto } from './dto/autosave-coding.dto';
import { ManagerReviewDto } from './dto/manager-review.dto';
export declare class AssessmentsController {
    private readonly assessmentsService;
    private readonly mcqService;
    private readonly typingService;
    private readonly codingService;
    constructor(assessmentsService: AssessmentsService, mcqService: McqService, typingService: TypingService, codingService: CodingService);
    start(id: string, user: JwtPayload): Promise<import("./entities/assessment.entity").Assessment>;
    getStatus(id: string, user: JwtPayload): Promise<{
        status: import("./enums/assessment-status.enum").AssessmentStatus;
        currentRound: import("./enums/assessment-status.enum").AssessmentStatus;
        timeRemaining: number;
    }>;
    getMcqQuestions(id: string, user: JwtPayload): Promise<CandidateMcqQuestion[]>;
    submitMcq(id: string, dto: SubmitMcqDto, user: JwtPayload): Promise<{
        score: number;
        total: number;
        percentage: number;
    }>;
    getTypingPassage(id: string, user: JwtPayload): Promise<{
        passage: string;
    }>;
    submitTyping(id: string, dto: SubmitTypingDto, user: JwtPayload): Promise<import("./entities/typing-result.entity").TypingResult>;
    getCodingQuestion(id: string, user: JwtPayload): Promise<import("./entities/question.entity").Question>;
    autosaveCoding(id: string, dto: AutosaveCodingDto, user: JwtPayload): Promise<void>;
    submitCoding(id: string, dto: SubmitCodingDto, user: JwtPayload): Promise<import("./entities/coding-submission.entity").CodingSubmission>;
    addManagerReview(id: string, dto: ManagerReviewDto, user: JwtPayload): Promise<import("./entities/coding-submission.entity").CodingSubmission>;
    getCodingSubmission(id: string, user: JwtPayload): Promise<import("./entities/coding-submission.entity").CodingSubmission>;
}
