import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CandidateStatus } from '../candidates/enums/candidate-status.enum';
import { assertOwnership } from '../common/helpers/ownership.helper';
import { Assessment } from './entities/assessment.entity';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { ReportsService } from '../reports/reports.service';
import { AssessmentGateway } from '../gateway/assessment.gateway';
import { ASSESSMENT_ROUND_DURATIONS } from './assessment.constants';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(Candidate)
    private readonly candidatesRepository: Repository<Candidate>,
    private readonly reportsService: ReportsService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => AssessmentGateway))
    private readonly gateway: AssessmentGateway,
  ) {}

  /**
   * Create a new assessment and attach it to a candidate.
   * Atomic operation using transaction.
   */
  async create(candidateId: string): Promise<Assessment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const candidate = await queryRunner.manager.findOne(Candidate, {
        where: { id: candidateId, isDeleted: false },
      });

      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      const assessment = queryRunner.manager.create(Assessment, {
        candidateId,
        status: AssessmentStatus.NOT_STARTED,
        startedAt: null,
        completedAt: null,
      });

      const savedAssessment = await queryRunner.manager.save(assessment);
      candidate.assessment = savedAssessment;
      await queryRunner.manager.save(candidate);

      await queryRunner.commitTransaction();
      return savedAssessment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to create assessment');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Start the first round for the owning candidate.
   */
  async start(assessmentId: string, user: JwtPayload): Promise<Assessment> {
    const assessment = await this.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.NOT_STARTED) {
      throw new BadRequestException('Assessment has already started');
    }

    assessment.status = AssessmentStatus.ROUND_1;
    assessment.startedAt = new Date();

    return this.assessmentsRepository.save(assessment);
  }

  /**
   * Return the current round and remaining time in seconds.
   */
  async getStatus(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<{
    status: AssessmentStatus;
    currentRound: AssessmentStatus;
    timeRemaining: number;
  }> {
    const assessment = await this.getAssessmentForUser(assessmentId, user);

    return {
      status: assessment.status,
      currentRound: assessment.status,
      timeRemaining: this.calculateTimeRemainingSeconds(assessment),
    };
  }

  /**
   * Advance the assessment to the next round or complete it.
   * Atomic operation using transaction.
   */
  async advanceRound(assessmentId: string): Promise<Assessment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assessment = await queryRunner.manager.findOne(Assessment, {
        where: { id: assessmentId },
        relations: ['candidate'],
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      if (assessment.status === AssessmentStatus.ROUND_1) {
        assessment.status = AssessmentStatus.ROUND_2;
        assessment.round2StartedAt = new Date();
      } else if (assessment.status === AssessmentStatus.ROUND_2) {
        assessment.status = AssessmentStatus.ROUND_3;
        assessment.round3StartedAt = new Date();
      } else if (assessment.status === AssessmentStatus.ROUND_3) {
        assessment.status = AssessmentStatus.COMPLETED;
        assessment.completedAt = new Date();

        const candidate = await queryRunner.manager.findOne(Candidate, {
          where: { id: assessment.candidateId, isDeleted: false },
        });

        if (candidate) {
          candidate.status = CandidateStatus.SUBMITTED;
          await queryRunner.manager.save(candidate);
        }

        // Generate report automatically on completion
        await this.reportsService.generateWithManager(assessment.id, queryRunner.manager);
      }

      const savedAssessment = await queryRunner.manager.save(assessment);
      await queryRunner.commitTransaction();
      
      // Notify client via WebSocket (after commit)
      this.gateway.emitRoundAdvanced(assessmentId, savedAssessment.status);

      return savedAssessment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to advance round');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate the active round against the server-side timer with a 5 second grace window.
   */
  validateTimeLimit(
    assessment: Assessment,
    round: 'mcq' | 'typing' | 'coding',
  ): void {
    const timeRemaining = this.calculateTimeRemainingSeconds(assessment, round);

    if (timeRemaining < -5) {
      throw new BadRequestException('Time limit exceeded');
    }
  }

  /**
   * Load an assessment and assert caller ownership unless their role bypasses it.
   */
  async getAssessmentForUser(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<Assessment> {
    const assessment = await this.assessmentsRepository.findOne({
      where: { id: assessmentId },
      relations: ['candidate', 'candidate.user'],
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    assertOwnership(user.sub, assessment.candidate.user.id, user.role);
    return assessment;
  }

  /**
   * Persist assessment field changes from round services.
   */
  async saveAssessment(assessment: Assessment): Promise<Assessment> {
    return this.assessmentsRepository.save(assessment);
  }

  /**
   * Calculate the remaining time for a round from server timestamps only.
   */
  calculateTimeRemainingSeconds(
    assessment: Assessment,
    round?: 'mcq' | 'typing' | 'coding',
  ): number {
    if (!assessment.startedAt) {
      return 0;
    }

    const activeRound = round ?? this.getRoundKeyFromStatus(assessment.status);
    if (!activeRound) {
      return 0;
    }

    const startedAt = this.getRoundStartedAt(assessment, activeRound).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const durationSeconds = this.getRoundDurationSeconds(assessment, activeRound);

    return durationSeconds - elapsedSeconds;
  }

  private getRoundKeyFromStatus(
    status: AssessmentStatus,
  ): 'mcq' | 'typing' | 'coding' | null {
    if (status === AssessmentStatus.ROUND_1) {
      return 'mcq';
    }

    if (status === AssessmentStatus.ROUND_2) {
      return 'typing';
    }

    if (status === AssessmentStatus.ROUND_3) {
      return 'coding';
    }

    return null;
  }

  private getRoundStartedAt(
    assessment: Assessment,
    round: 'mcq' | 'typing' | 'coding',
  ): Date {
    const startedAt = assessment.startedAt ?? new Date();

    if (round === 'mcq') {
      return startedAt;
    }

    if (round === 'typing') {
      return assessment.round2StartedAt ?? assessment.createdAt ?? startedAt;
    }

    return assessment.round3StartedAt ?? assessment.createdAt ?? startedAt;
  }

  private getRoundDurationSeconds(
    assessment: Assessment,
    round: 'mcq' | 'typing' | 'coding',
  ): number {
    if (round === 'mcq') {
      return ASSESSMENT_ROUND_DURATIONS.mcq * 60;
    }

    if (round === 'typing') {
      return ASSESSMENT_ROUND_DURATIONS.typing * 60;
    }

    return ASSESSMENT_ROUND_DURATIONS.coding * 60;
  }
}
