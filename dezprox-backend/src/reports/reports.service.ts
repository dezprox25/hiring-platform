import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Report } from './entities/report.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { McqAnswer } from '../assessments/entities/mcq-answer.entity';
import { TypingResult } from '../assessments/entities/typing-result.entity';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { ReleaseResultDto } from './dto/release-result.dto';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Role } from '../common/enums/role.enum';
import { assertOwnership } from '../common/helpers/ownership.helper';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

export const SCORE_WEIGHTS = {
  MCQ_WEIGHT: 0.4,
  TYPING_WEIGHT: 0.2,
  CODING_WEIGHT: 0.4,
  TYPING_MAX_WPM: 80,
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(Assessment)
    private readonly assessmentsRepository: Repository<Assessment>,
    @InjectRepository(McqAnswer)
    private readonly mcqAnswersRepository: Repository<McqAnswer>,
    @InjectRepository(TypingResult)
    private readonly typingResultsRepository: Repository<TypingResult>,
    @InjectRepository(CodingSubmission)
    private readonly codingSubmissionsRepository: Repository<CodingSubmission>,
    @InjectRepository(Candidate)
    private readonly candidatesRepository: Repository<Candidate>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Generates a denormalized report for an assessment.
   * Triggered internally when assessment status becomes COMPLETED.
   * @param assessmentId UUID of the assessment
   */
  async generate(assessmentId: string): Promise<Report> {
    return this.reportsRepository.manager.transaction(async (manager) => {
      return this.generateWithManager(assessmentId, manager);
    });
  }

  /**
   * Internal generator that accepts a transaction manager.
   */
  async generateWithManager(assessmentId: string, manager: EntityManager): Promise<Report> {
    // 1. Idempotency check
    const existing = await manager.findOne(Report, {
      where: { assessmentId },
    });
    if (existing) return existing;

    // 2. Fetch all necessary data
    const assessment = await manager.findOne(Assessment, {
      where: { id: assessmentId },
      relations: ['candidate', 'candidate.user'],
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const mcqAnswers = await manager.find(McqAnswer, {
      where: { assessmentId },
    });

    const typingResult = await manager.findOne(TypingResult, {
      where: { assessmentId },
    });

    const codingSubmission = await manager.findOne(CodingSubmission, {
      where: { assessmentId },
    });

    // 3. MCQ Topic Breakdown and Scoring
    const mcqCorrect = mcqAnswers.filter((a) => a.isCorrect).length;
    const mcqTotal = mcqAnswers.length;
    const mcqPercentage = mcqTotal === 0 ? 0 : (mcqCorrect / mcqTotal) * 100;
    
    const topicBreakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    mcqAnswers.forEach((answer) => {
      const category = answer.topic || 'General';
      if (!topicBreakdown[category]) {
        topicBreakdown[category] = { correct: 0, total: 0, percentage: 0 };
      }
      topicBreakdown[category].total += 1;
      if (answer.isCorrect) {
        topicBreakdown[category].correct += 1;
      }
    });

    Object.keys(topicBreakdown).forEach((category) => {
      const topic = topicBreakdown[category];
      topic.percentage = Number(((topic.correct / topic.total) * 100).toFixed(2));
    });

    // 4. Scoring Calculation
    const mcqContrib = mcqPercentage * SCORE_WEIGHTS.MCQ_WEIGHT;
    
    const typingWpm = typingResult?.wpm ?? 0;
    const typingContrib = Math.min((typingWpm / SCORE_WEIGHTS.TYPING_MAX_WPM) * 100, 100) * SCORE_WEIGHTS.TYPING_WEIGHT;

    const codingFinalScore = this.calculateCodingFinalScore(codingSubmission);
    const codingContrib = (codingFinalScore ?? 0) * SCORE_WEIGHTS.CODING_WEIGHT;

    const totalScore = Number((mcqContrib + typingContrib + codingContrib).toFixed(2));

    // 5. Build and Save Report
    const report = manager.create(Report, {
      candidateId: assessment.candidateId,
      assessmentId: assessment.id,
      mcqCorrect,
      mcqTotal,
      mcqPercentage: Number(mcqPercentage.toFixed(2)),
      mcqTopicBreakdown: topicBreakdown,
      typingWpm,
      typingAccuracy: typingResult?.accuracy ?? 0,
      codingManagerScore: codingSubmission?.managerScore ?? null,
      codingAiScore: codingSubmission?.aiScore ?? null,
      totalScore,
    });

    // 6. Save and return
    const saved = await manager.save(report);

    // Invalidate analytics cache
    await this.cacheManager.del('analytics_dashboard');

    return saved;
  }

  /**
   * Helper to fetch the report entity by candidate ID.
   */
  async getReportEntityByCandidateId(candidateId: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { candidateId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  /**
   * Recalculates scores when coding manager score is updated.
   * @param reportId UUID of the report
   */
  async recalculateScore(reportId: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const codingSubmission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId: report.assessmentId },
    });

    const codingFinalScore = this.calculateCodingFinalScore(codingSubmission);
    
    // Update coding scores in report
    report.codingManagerScore = codingSubmission?.managerScore ?? null;
    report.codingAiScore = codingSubmission?.aiScore ?? null;

    // Recalculate total score
    const mcqContrib = report.mcqPercentage * SCORE_WEIGHTS.MCQ_WEIGHT;
    const typingContrib = Math.min((report.typingWpm / SCORE_WEIGHTS.TYPING_MAX_WPM) * 100, 100) * SCORE_WEIGHTS.TYPING_WEIGHT;
    const codingContrib = (codingFinalScore ?? 0) * SCORE_WEIGHTS.CODING_WEIGHT;
    
    report.totalScore = Number((mcqContrib + typingContrib + codingContrib).toFixed(2));

    return this.reportsRepository.save(report);
  }

  private calculateCodingFinalScore(submission: CodingSubmission | null): number | null {
    if (!submission) return null;
    const scores: number[] = [];
    if (submission.managerScore !== null) scores.push(submission.managerScore);
    if (submission.aiScore !== null) scores.push(submission.aiScore);

    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Fetches all reports with filters and pagination.
   */
  async findAll(filters: {
    roleApplied?: string;
    isShortlisted?: boolean;
    minScore?: number;
    maxScore?: number;
    page?: number;
    limit?: number;
  }, user: JwtPayload) {
    const { roleApplied, isShortlisted, minScore, maxScore, page = 1, limit = 10 } = filters;

    const query = this.reportsRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.candidate', 'candidate')
      .leftJoinAndSelect('candidate.user', 'user');

    if (roleApplied) {
      query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
    }
    if (isShortlisted !== undefined) {
      query.andWhere('report.isShortlisted = :isShortlisted', { isShortlisted });
    }
    if (minScore !== undefined) {
      query.andWhere('report.totalScore >= :minScore', { minScore });
    }
    if (maxScore !== undefined) {
      query.andWhere('report.totalScore <= :maxScore', { maxScore });
    }

    const [data, total] = await query
      .orderBy('report.totalScore', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map(r => this.mapToResponse(r, user.role)),
      total,
    };
  }

  /**
   * Fetches a single report by candidate ID.
   */
  async findByCandidateId(candidateId: string, user: JwtPayload): Promise<any> {
    const report = await this.reportsRepository.findOne({
      where: { candidateId },
      relations: ['candidate', 'candidate.user', 'assessment', 'feedbacks', 'feedbacks.user'],
    });

    if (!report) throw new NotFoundException('Report not found');

    assertOwnership(user.sub, report.candidate.user.id, user.role);

    if (user.role === Role.CANDIDATE && !report.isResultReleased) {
      throw new BadRequestException('Result not released yet');
    }

    return this.mapToResponse(report, user.role);
  }

  /**
   * Releases results for a candidate so they can see their report.
   */
  async releaseResult(reportId: string, dto: ReleaseResultDto, user: JwtPayload): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');

    report.isResultReleased = dto.released;

    return this.reportsRepository.save(report);
  }

  /**
   * Shortlists a candidate based on their report.
   */
  async toggleShortlist(reportId: string, isShortlisted: boolean): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');

    report.isShortlisted = isShortlisted;
    const saved = await this.reportsRepository.save(report);
    
    // Invalidate analytics
    await this.cacheManager.del('analytics_dashboard');
    
    return saved;
  }

  /**
   * Internal helper to map report to response shape.
   */
  private mapToResponse(report: Report, role: Role): any {
    const response: any = { ...report };
    
    // If candidate, hide internal metadata
    if (role === Role.CANDIDATE) {
      delete response.codingManagerScore;
      delete response.isShortlisted;
    }

    return response;
  }
}
