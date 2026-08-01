import { Repository, EntityManager } from 'typeorm';
import { Cache } from 'cache-manager';
import { Report } from './entities/report.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { McqAnswer } from '../assessments/entities/mcq-answer.entity';
import { TypingResult } from '../assessments/entities/typing-result.entity';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { ReleaseResultDto } from './dto/release-result.dto';
import { Candidate } from '../candidates/entities/candidate.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
export declare const SCORE_WEIGHTS: {
    MCQ_WEIGHT: number;
    TYPING_WEIGHT: number;
    CODING_WEIGHT: number;
    TYPING_MAX_WPM: number;
};
export declare class ReportsService {
    private readonly reportsRepository;
    private readonly assessmentsRepository;
    private readonly mcqAnswersRepository;
    private readonly typingResultsRepository;
    private readonly codingSubmissionsRepository;
    private readonly candidatesRepository;
    private cacheManager;
    constructor(reportsRepository: Repository<Report>, assessmentsRepository: Repository<Assessment>, mcqAnswersRepository: Repository<McqAnswer>, typingResultsRepository: Repository<TypingResult>, codingSubmissionsRepository: Repository<CodingSubmission>, candidatesRepository: Repository<Candidate>, cacheManager: Cache);
    generate(assessmentId: string): Promise<Report>;
    generateWithManager(assessmentId: string, manager: EntityManager): Promise<Report>;
    getReportEntityByCandidateId(candidateId: string): Promise<Report>;
    recalculateScore(reportId: string): Promise<Report>;
    private calculateCodingFinalScore;
    findAll(filters: {
        roleApplied?: string;
        isShortlisted?: boolean;
        minScore?: number;
        maxScore?: number;
        page?: number;
        limit?: number;
    }, user: JwtPayload): Promise<{
        data: any[];
        total: number;
    }>;
    findByCandidateId(candidateId: string, user: JwtPayload): Promise<any>;
    findById(id: string, user: JwtPayload): Promise<any>;
    releaseResult(reportId: string, dto: ReleaseResultDto, user: JwtPayload): Promise<Report>;
    toggleShortlist(reportId: string, isShortlisted: boolean): Promise<Report>;
    private mapToResponse;
}
