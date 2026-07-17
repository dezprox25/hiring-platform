import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/nestjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { AiEvaluation } from './entities/ai-evaluation.entity';
import { AiEvaluationStatus } from './enums/ai-evaluation-status.enum';
import { CandidatesService } from '../candidates/candidates.service';
import { ReportsService } from '../reports/reports.service';
import { OpenAiService } from './openai.service';
import { buildEvaluationPrompt } from './prompts/evaluation.prompt';
import { RetriggerEvaluationDto } from './dto/retrigger-evaluation.dto';
import { Role } from '../common/enums/role.enum';
import { MetricsService } from '../metrics/metrics.service';
import { AlertService } from '../common/alerts/alert.service';

@Injectable()
export class AiEvaluationService {
  private readonly logger = new Logger(AiEvaluationService.name);

  constructor(
    @InjectRepository(AiEvaluation)
    private readonly aiEvaluationRepository: Repository<AiEvaluation>,
    @InjectRepository(CodingSubmission)
    private readonly codingSubmissionsRepository: Repository<CodingSubmission>,
    @Inject(forwardRef(() => CandidatesService))
    private readonly candidatesService: CandidatesService,
    private readonly reportsService: ReportsService,
    private readonly openAiService: OpenAiService,
    private readonly metricsService: MetricsService,
    private readonly alertService: AlertService,
    @InjectQueue('ai-evaluation') private readonly aiEvaluationQueue: Queue,
  ) {}

  /**
   * Enqueues an AI evaluation job.
   */
  async triggerEvaluation(
    candidateId: string,
    force: boolean = false,
  ): Promise<void> {
    this.logger.log(`Enqueuing AI evaluation for candidate ${candidateId}`);
    
    // Check if evaluation already exists and is completed
    const existing = await this.aiEvaluationRepository.findOne({ where: { candidateId } });
    if (existing && existing.status === AiEvaluationStatus.COMPLETED && !force) {
      return;
    }

    // Initialize or reset status to PENDING/RUNNING in DB first to provide immediate feedback
    let evaluation = existing;
    if (!evaluation) {
      evaluation = this.aiEvaluationRepository.create({ candidateId });
    }
    evaluation.status = AiEvaluationStatus.PENDING;
    evaluation.errorMessage = null;
    await this.aiEvaluationRepository.save(evaluation);

    await this.aiEvaluationQueue.add('evaluate', { candidateId, force }, {
      jobId: `ai-eval-${candidateId}`, // Prevent duplicate active jobs for same candidate
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });
  }

  /**
   * Actual processing logic called by the BullMQ worker.
   */
  async processEvaluation(
    candidateId: string,
    force: boolean = false,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      let evaluation = await this.aiEvaluationRepository.findOne({
        where: { candidateId },
      });

      if (!evaluation) {
        evaluation = this.aiEvaluationRepository.create({ candidateId });
      }

      evaluation.status = AiEvaluationStatus.RUNNING;
      await this.aiEvaluationRepository.save(evaluation);

      this.logger.log(`Starting background AI evaluation for candidate ${candidateId}`);
      
      // Rest of the logic remains same as before...
      const mockStaffUser = { sub: 'system', role: Role.ADMIN, email: 'system@dezprox.com' };
      const candidate = await this.candidatesService.findOne(candidateId, mockStaffUser);

      if (!candidate || !candidate.assessment) {
        throw new Error('Candidate or assessment not found');
      }

      const reportEntity = await this.reportsService.getReportEntityByCandidateId(candidateId);
      const codingSubmission = await this.codingSubmissionsRepository.findOne({
        where: { assessmentId: reportEntity.assessmentId },
        relations: ['question'],
      });

      const inputData = {
        candidateName: candidate.fullName,
        roleApplied: candidate.roleApplied,
        mcq: {
          totalQuestions: reportEntity.mcqTotal,
          correctAnswers: reportEntity.mcqCorrect,
          percentage: Number(reportEntity.mcqPercentage),
          topicBreakdown: reportEntity.mcqTopicBreakdown,
        },
        typing: {
          wpm: reportEntity.typingWpm,
          accuracy: Number(reportEntity.typingAccuracy),
          timeTakenSeconds: 0,
        },
        coding: {
          question: codingSubmission?.question?.text || 'N/A',
          submittedCode: codingSubmission?.code || '',
          language: codingSubmission?.language ? String(codingSubmission.language) : 'N/A',
          managerScore: codingSubmission?.managerScore ?? null,
          managerReview: codingSubmission?.managerFeedback ?? null,
        },
      };

      const { systemPrompt, userMessage } = buildEvaluationPrompt(inputData);
      const gptResult = await this.openAiService.evaluate(systemPrompt, userMessage);

      evaluation.status = AiEvaluationStatus.COMPLETED;
      evaluation.strengths = gptResult.strengths;
      evaluation.weaknesses = gptResult.weaknesses;
      evaluation.codingAnalysis = gptResult.codingAnalysis;
      evaluation.communicationAnalysis = gptResult.communicationAnalysis;
      evaluation.summary = gptResult.summary;
      evaluation.recommendation = gptResult.recommendation as any;
      evaluation.overallScore = gptResult.overallScore;
      evaluation.rawResponse = JSON.stringify(gptResult);
      evaluation.lastEvaluatedAt = new Date();
      
      await this.aiEvaluationRepository.save(evaluation);

      if (codingSubmission) {
        await this.codingSubmissionsRepository.update(codingSubmission.id, {
          aiScore: gptResult.overallScore,
          aiAnalysis: gptResult as any,
          aiAnalysedAt: new Date(),
        });
      }

      await this.reportsService.recalculateScore(reportEntity.id);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.aiEvaluationDuration.observe(duration);
      this.logger.log(`Background AI evaluation completed for ${candidateId} in ${duration}s`);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : '';
      this.logger.error(`Background AI Evaluation failed for candidate ${candidateId}: ${message}`, stack);
      Sentry.captureException(err, { extra: { candidateId, force } });
      await this.alertService.sendAlert(`Background AI Evaluation Failure`, { candidateId, error: message });

      const evaluation = await this.aiEvaluationRepository.findOne({ where: { candidateId } });
      if (evaluation) {
        evaluation.status = AiEvaluationStatus.FAILED;
        evaluation.errorMessage = message;
        await this.aiEvaluationRepository.save(evaluation);
      }
      throw err; // Re-throw for BullMQ retry
    }
  }

  /**
   * Returns the AI evaluation record for a candidate.
   */
  async findByCandidateId(candidateId: string): Promise<AiEvaluation> {
    const evaluation = await this.aiEvaluationRepository.findOne({
      where: { candidateId },
    });

    if (!evaluation) {
      throw new NotFoundException('AI evaluation not found for this candidate');
    }

    // Strip internal fields
    const { rawResponse, errorMessage, ...safeEval } = evaluation;
    return safeEval as AiEvaluation;
  }

  /**
   * Returns only the current evaluation status.
   */
  async getStatus(candidateId: string): Promise<{ status: AiEvaluationStatus }> {
    const evaluation = await this.aiEvaluationRepository.findOne({
      where: { candidateId },
      select: ['status'],
    });

    if (!evaluation) {
      throw new NotFoundException('AI evaluation not found for this candidate');
    }

    return { status: evaluation.status };
  }

  /**
   * Manually triggers or re-triggers AI evaluation.
   */
  async retrigger(
    candidateId: string,
    dto: RetriggerEvaluationDto,
  ): Promise<{ message: string }> {
    const existing = await this.aiEvaluationRepository.findOne({
      where: { candidateId },
    });

    if (existing && existing.status === AiEvaluationStatus.COMPLETED && !dto.force) {
      throw new ConflictException(
        'Evaluation already completed. Pass force=true to re-run.',
      );
    }

    if (existing && dto.force) {
      // Reset result fields
      existing.status = AiEvaluationStatus.PENDING;
      existing.strengths = null;
      existing.weaknesses = null;
      existing.codingAnalysis = null;
      existing.communicationAnalysis = null;
      existing.summary = null;
      existing.recommendation = null;
      existing.overallScore = null;
      existing.rawResponse = null;
      existing.errorMessage = null;
      await this.aiEvaluationRepository.save(existing);
    }

    // Trigger fire-and-forget
    this.triggerEvaluation(candidateId, dto.force);

    return { message: 'Evaluation started' };
  }
}
