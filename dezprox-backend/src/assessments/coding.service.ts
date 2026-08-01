import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { AutosaveCodingDto } from './dto/autosave-coding.dto';
import { SubmitCodingDto } from './dto/submit-coding.dto';
import { CodingSubmission } from './entities/coding-submission.entity';
import { Question } from './entities/question.entity';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { QuestionType } from './enums/question-type.enum';
import { ReportsService } from '../reports/reports.service';
import { ManagerReviewDto } from './dto/manager-review.dto';
import { AiEvaluationService } from '../ai-evaluation/ai-evaluation.service';
import { CodingQuestionService } from '../question-bank/coding-question.service';

@Injectable()
export class CodingService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(CodingSubmission)
    private readonly codingSubmissionsRepository: Repository<CodingSubmission>,
    private readonly assessmentsService: AssessmentsService,
    private readonly reportsService: ReportsService,
    private readonly aiEvaluationService: AiEvaluationService,
    private readonly codingQuestionService: CodingQuestionService,
  ) {}

  /**
   * Return the coding question for the active assessment.
   */
  async getQuestion(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<Question> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_3) {
      throw new BadRequestException('Coding round is not active');
    }

    // Check if there's already a submission with a question assigned
    const existingSubmission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId },
      relations: ['question'],
    });

    if (existingSubmission) {
      return existingSubmission.question;
    }

    // Otherwise, pick a random coding question matching the role
    const category = assessment.candidate.roleApplied;

    // Try the Question Bank (coding_questions) first
    let codingBankQuestion = null;
    try {
      codingBankQuestion = await this.codingQuestionService.findOneActive(category as any);
    } catch {
      // Fallback if Question Bank service fails
    }

    let question: Question | null = null;
    if (codingBankQuestion) {
      // Create or find a corresponding Question record so CodingSubmission FK works
      question = await this.questionsRepository.findOne({
        where: { id: codingBankQuestion.id },
      });
      if (!question) {
        // Create a synced Question record from the bank question
        question = this.questionsRepository.create({
          type: QuestionType.CODING,
          category: category,
          difficulty: codingBankQuestion.difficulty as any,
          text: codingBankQuestion.prompt,
          options: null,
          correctAnswer: null,
          codeStarter: null,
          isActive: true,
          createdById: assessment.candidate.user?.id || assessment.candidate.userId,
        });
        question = await this.questionsRepository.save(question);
      }
    }

    if (!question) {
      question = await this.questionsRepository
        .createQueryBuilder('question')
        .where('question.type = :type', { type: QuestionType.CODING })
        .andWhere('question.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(question.category) = LOWER(:category)', { category })
        .orderBy('RANDOM()')
        .getOne();
    }

    if (!question) {
      question = await this.questionsRepository
        .createQueryBuilder('question')
        .where('question.type = :type', { type: QuestionType.CODING })
        .andWhere('question.isActive = :isActive', { isActive: true })
        .orderBy('RANDOM()')
        .getOne();
    }

    if (!question) {
      throw new NotFoundException('No coding questions available');
    }

    // Create a submission record to lock in the question
    const submission = this.codingSubmissionsRepository.create({
      assessmentId,
      questionId: question.id,
      code: question.codeStarter || '',
    });
    await this.codingSubmissionsRepository.save(submission);

    return question;
  }

  /**
   * Save draft code without advancing the round.
   */
  async autosave(
    assessmentId: string,
    dto: AutosaveCodingDto,
    user: JwtPayload,
  ): Promise<void> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_3) {
      throw new BadRequestException('Coding round is not active');
    }

    const submission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId },
      relations: ['assessment'],
    });

    if (!submission) {
      throw new NotFoundException('Coding submission record not found');
    }

    submission.draftCode = dto.draftCode;
    await this.codingSubmissionsRepository.save(submission);
  }

  /**
   * Finalize the coding round and advance the assessment status.
   */
  async submitCoding(
    assessmentId: string,
    dto: SubmitCodingDto,
    user: JwtPayload,
  ): Promise<CodingSubmission> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_3) {
      throw new BadRequestException('Coding round is not active');
    }

    this.assessmentsService.validateTimeLimit(assessment, 'coding');

    const submission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId },
      relations: ['assessment'],
    });

    if (!submission) {
      throw new NotFoundException('Coding submission record not found');
    }

    submission.code = dto.code;
    submission.language = dto.language;
    submission.timeTakenSeconds = dto.timeTakenSeconds;
    submission.submittedAt = new Date();

    const savedSubmission = await this.codingSubmissionsRepository.save(submission);

    await this.assessmentsService.saveAssessment(assessment);

    // Advance to completed
    await this.assessmentsService.advanceRound(assessmentId);

    // Trigger AI evaluation fire-and-forget
    this.aiEvaluationService.triggerEvaluation(assessment.candidateId);

    return savedSubmission;
  }

  /**
   * Allows a manager to review and score a coding submission.
   * Triggers a report score recalculation.
   */
  async addManagerReview(
    assessmentId: string,
    dto: ManagerReviewDto,
    user: JwtPayload,
  ): Promise<CodingSubmission> {
    const submission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId },
      relations: ['assessment'],
    });

    if (!submission) {
      throw new NotFoundException('Coding submission record not found');
    }

    submission.managerScore = dto.managerScore;
    submission.managerFeedback = dto.managerFeedback;
    submission.managerReviewedAt = new Date();

    const saved = await this.codingSubmissionsRepository.save(submission);

    // Recalculate the report score if it exists
    try {
      const report = await this.reportsService.findByCandidateId(submission.assessment.candidateId, user);
      if (report) {
        await this.reportsService.recalculateScore(report.id);
      }
    } catch (error) {
      // Report might not exist yet if assessment not completed, or error fetching
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Could not recalculate report score:', message);
    }

    return saved;
  }

  /**
   * Return a single coding submission by assessment ID.
   */
  async getSubmission(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<CodingSubmission> {
    // Staff roles bypass ownership, candidates can only see their own (handled in controller)
    const submission = await this.codingSubmissionsRepository.findOne({
      where: { assessmentId },
      relations: ['question', 'assessment', 'assessment.candidate'],
    });

    if (!submission) {
      throw new NotFoundException('Coding submission not found');
    }

    return submission;
  }
}
