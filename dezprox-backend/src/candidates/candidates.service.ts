import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException, 
  InternalServerErrorException,
  Inject,
  forwardRef 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CandidateStatus } from './enums/candidate-status.enum';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';
import { assertOwnership } from '../common/helpers/ownership.helper';
import { User } from '../users/entities/user.entity';
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
  user?: { id: string; email: string } | null;
  assessment?: { id: string; status?: string } | null;
  report?: { totalScore: number; mcqPercentage: number } | null;
  aiRecommendation?: string;
}

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    private usersService: UsersService,
    private mailService: MailService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => AssessmentGateway))
    private readonly gateway: AssessmentGateway,
    @Inject(forwardRef(() => AssessmentsService))
    private readonly assessmentsService: AssessmentsService,
  ) {}

  /**
   * Create a new candidate, their user account, and send an invite email.
   * Atomic operation using TypeORM transaction.
   */
  async create(dto: CreateCandidateDto, createdBy: JwtPayload): Promise<CandidateResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let user = existingUser;
      let password = '';

      if (!user) {
        // 1. Generate random 8-char password
        password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        // 2. Create User account
        user = queryRunner.manager.create(User, {
          email: dto.email.trim().toLowerCase(),
          password_hash: passwordHash,
          role: Role.CANDIDATE,
          is_active: true,
        });
        user = await queryRunner.manager.save(user);
      } else {
        // Check if user is already a candidate in the candidates table
        const existingCandidate = await queryRunner.manager.findOne(Candidate, {
          where: { user: { id: user.id } },
        });

        if (existingCandidate && !existingCandidate.isDeleted) {
          throw new ConflictException('A candidate with this email already exists');
        }

        if (existingCandidate && existingCandidate.isDeleted) {
          // Restore deleted candidate
          existingCandidate.isDeleted = false;
          existingCandidate.fullName = dto.fullName;
          existingCandidate.phone = dto.phone;
          existingCandidate.roleApplied = dto.roleApplied;
          existingCandidate.status = CandidateStatus.INVITED;
          const savedCandidate = await queryRunner.manager.save(existingCandidate);
          await queryRunner.commitTransaction();
          return this.findOneResponse(savedCandidate.id, createdBy);
        }
        
        // If user exists but no candidate record, we'll create one below
      }

      // 3. Create Candidate record
      const candidate = queryRunner.manager.create(Candidate, {
        fullName: dto.fullName,
        phone: dto.phone,
        roleApplied: dto.roleApplied,
        notes: dto.notes,
        user: user,
        status: CandidateStatus.INVITED,
      });
      const savedCandidate = await queryRunner.manager.save(candidate);

      await queryRunner.commitTransaction();

      // Provision an assessment for the new candidate
      try {
        await this.assessmentsService.create(savedCandidate.id);
      } catch {
        // Assessment creation is best-effort; candidate was already created
      }

      // Send invite if we created a new user or if we want to re-invite
      if (password) {
        try {
          await this.mailService.sendInvite(dto.email, dto.fullName, password);
        } catch {
          // Candidate was created; mail is best-effort
        }
      }

      return this.findOneResponse(savedCandidate.id, createdBy);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create candidate');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Returns all candidates with optional filtering and pagination.
   */
  async findAll(params: {
    status?: string;
    roleApplied?: string;
    search?: string;
    page?: number;
    limit?: number;
  }, user: JwtPayload): Promise<{ data: CandidateResponse[]; total: number }> {
    const { status, roleApplied, search, page = 1, limit = 10 } = params;
    const query = this.candidateRepository.createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.user', 'user')
      .leftJoinAndSelect('candidate.assessment', 'assessment')
      .leftJoinAndSelect('candidate.report', 'report')
      .where('candidate.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      query.andWhere('candidate.status = :status', { status });
    }
    if (roleApplied) {
      query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
    }
    if (search) {
      query.andWhere('(candidate.fullName ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await query
      .orderBy('candidate.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map(c => this.mapToResponse(c, user.role)),
      total,
    };
  }

  /**
   * Returns a single candidate by ID.
   */
  async findOne(id: string, requestingUser: JwtPayload): Promise<CandidateResponse> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'assessment', 'report', 'aiEvaluation'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    assertOwnership(requestingUser.sub, candidate.user.id, requestingUser.role);
    return this.mapToResponse(candidate, requestingUser.role);
  }

  /**
   * Returns the candidate record for the currently logged-in user.
   */
  async findMe(user: JwtPayload): Promise<CandidateResponse> {
    const candidate = await this.candidateRepository.findOne({
      where: { user: { id: user.sub }, isDeleted: false },
      relations: ['user', 'assessment', 'report'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate record not found');
    }

    return this.mapToResponse(candidate, user.role);
  }

  /**
   * Updates a candidate record.
   */
  async update(id: string, dto: UpdateCandidateDto, user: JwtPayload): Promise<CandidateResponse> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    assertOwnership(user.sub, candidate.user.id, user.role);

    Object.assign(candidate, dto);
    const saved = await this.candidateRepository.save(candidate);
    return this.mapToResponse(saved, user.role);
  }

  /**
   * Updates candidate status and handles side effects (notifications, etc).
   */
  async updateStatus(id: string, dto: UpdateStatusDto, user: JwtPayload): Promise<CandidateResponse> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    this.validateStatusTransition(candidate.status, dto.status, user.role);

    candidate.status = dto.status;
    const saved = await this.candidateRepository.save(candidate);
    
    // Notify via websocket for HR/Admin visibility
    this.gateway.emitStatusUpdate(id, saved.status);

    return this.mapToResponse(saved, user.role);
  }

  /**
   * Resets a candidate's password and resends the invite email.
   */
  async resendInvite(id: string): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const password = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(password, 10);

    await this.candidateRepository.manager.update(User, candidate.user.id, {
      password_hash: passwordHash,
    });

    await this.mailService.sendInvite(candidate.user.email, candidate.fullName, password);
  }

  /**
   * Soft delete a candidate.
   */
  async softDelete(id: string): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    candidate.isDeleted = true;
    await this.candidateRepository.save(candidate);
  }

  /**
   * Validates if a status transition is allowed based on the requester's role.
   */
  private validateStatusTransition(current: CandidateStatus, next: CandidateStatus, role: Role) {
    const transitions: Record<CandidateStatus, CandidateStatus[]> = {
      [CandidateStatus.INVITED]: [CandidateStatus.ACTIVE],
      [CandidateStatus.ACTIVE]: [CandidateStatus.SUBMITTED],
      [CandidateStatus.SUBMITTED]: [CandidateStatus.EVALUATED],
      [CandidateStatus.EVALUATED]: [CandidateStatus.HIRED, CandidateStatus.REJECTED],
      [CandidateStatus.HIRED]: [],
      [CandidateStatus.REJECTED]: [CandidateStatus.HIRED], // Can move from rejected to hired if reconsidered
    };

    const allowed = transitions[current].includes(next);
    if (!allowed) {
      throw new BadRequestException('Invalid status transition');
    }

    // Role specific restrictions
    if (next === CandidateStatus.HIRED && role !== Role.ADMIN) {
      throw new BadRequestException('Only Admin can hire a candidate');
    }
  }

  /**
   * Internal helper to find and map a candidate to response shape.
   */
  private async findOneResponse(id: string, requestingUser: JwtPayload): Promise<CandidateResponse> {
    const c = await this.candidateRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'assessment', 'report', 'aiEvaluation'],
    });
    return this.mapToResponse(c, requestingUser.role);
  }

  /**
   * Maps a Candidate entity to the final response shape.
   * Strips password_hash and sensitive notes for candidates.
   */
  private mapToResponse(candidate: Candidate, role: Role): CandidateResponse {
    if (!candidate) return null;

    const response: any = {
      ...candidate,
      userId: candidate.user?.id,
      user: candidate.user
        ? {
            id: candidate.user.id,
            email: candidate.user.email,
          }
        : null,
      assessment: candidate.assessment
        ? {
            id: candidate.assessment.id,
            status: candidate.assessment.status,
          }
        : null,
    };

    delete response.report;
    delete response.aiEvaluation;

    if (role !== Role.CANDIDATE) {
      if (candidate.report) {
        response.report = {
          totalScore: candidate.report.totalScore != null ? Number(candidate.report.totalScore) : null,
          mcqPercentage: candidate.report.mcqPercentage != null ? Number(candidate.report.mcqPercentage) : null,
          isShortlisted: candidate.report.isShortlisted,
        };
      }
      if (candidate.aiEvaluation) {
        response.aiRecommendation = candidate.aiEvaluation.recommendation;
      }
    } else {
      delete response.notes;
    }

    return response;
  }
}
