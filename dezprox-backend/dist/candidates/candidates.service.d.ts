import { Repository, DataSource } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CandidateStatus } from './enums/candidate-status.enum';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentGateway } from '../gateway/assessment.gateway';
import { AssessmentsService } from '../assessments/assessments.service';
export interface CandidateResponse {
    id: string;
    fullName: string;
    phone: string | null;
    roleApplied: string;
    status: CandidateStatus;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user?: {
        id: string;
        email: string;
    } | null;
    assessment?: {
        id: string;
        status?: string;
    } | null;
    report?: {
        totalScore: number;
        mcqPercentage: number;
    } | null;
    aiRecommendation?: string;
}
export declare class CandidatesService {
    private candidateRepository;
    private usersService;
    private mailService;
    private dataSource;
    private readonly gateway;
    private readonly assessmentsService;
    constructor(candidateRepository: Repository<Candidate>, usersService: UsersService, mailService: MailService, dataSource: DataSource, gateway: AssessmentGateway, assessmentsService: AssessmentsService);
    create(dto: CreateCandidateDto, createdBy: JwtPayload): Promise<CandidateResponse>;
    findAll(params: {
        status?: string;
        roleApplied?: string;
        search?: string;
        page?: number;
        limit?: number;
    }, user: JwtPayload): Promise<{
        data: CandidateResponse[];
        total: number;
    }>;
    findOne(id: string, requestingUser: JwtPayload): Promise<CandidateResponse>;
    findMe(user: JwtPayload): Promise<CandidateResponse>;
    update(id: string, dto: UpdateCandidateDto, user: JwtPayload): Promise<CandidateResponse>;
    updateStatus(id: string, dto: UpdateStatusDto, user: JwtPayload): Promise<CandidateResponse>;
    resendInvite(id: string): Promise<void>;
    softDelete(id: string): Promise<void>;
    private validateStatusTransition;
    private findOneResponse;
    private mapToResponse;
}
