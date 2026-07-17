import { Repository, DataSource } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Assessment } from './entities/assessment.entity';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { ReportsService } from '../reports/reports.service';
import { AssessmentGateway } from '../gateway/assessment.gateway';
export declare class AssessmentsService {
    private readonly assessmentsRepository;
    private readonly candidatesRepository;
    private readonly reportsService;
    private readonly dataSource;
    private readonly gateway;
    constructor(assessmentsRepository: Repository<Assessment>, candidatesRepository: Repository<Candidate>, reportsService: ReportsService, dataSource: DataSource, gateway: AssessmentGateway);
    create(candidateId: string): Promise<Assessment>;
    start(assessmentId: string, user: JwtPayload): Promise<Assessment>;
    getStatus(assessmentId: string, user: JwtPayload): Promise<{
        status: AssessmentStatus;
        currentRound: AssessmentStatus;
        timeRemaining: number;
    }>;
    advanceRound(assessmentId: string): Promise<Assessment>;
    validateTimeLimit(assessment: Assessment, round: 'mcq' | 'typing' | 'coding'): void;
    getAssessmentForUser(assessmentId: string, user: JwtPayload): Promise<Assessment>;
    saveAssessment(assessment: Assessment): Promise<Assessment>;
    calculateTimeRemainingSeconds(assessment: Assessment, round?: 'mcq' | 'typing' | 'coding'): number;
    private getRoundKeyFromStatus;
    private getRoundStartedAt;
    private getRoundDurationSeconds;
}
