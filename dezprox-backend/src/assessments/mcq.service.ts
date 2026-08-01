import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { SubmitMcqDto } from './dto/submit-mcq.dto';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { McqAnswer } from './entities/mcq-answer.entity';
import { Question } from './entities/question.entity';
import { QuestionType } from './enums/question-type.enum';
import { McqQuestionService } from '../question-bank/mcq-question.service';

export interface CandidateMcqQuestion {
  id: string;
  type: QuestionType;
  category: string;
  difficulty: string;
  text: string;
  options: string[];
  codeStarter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class McqService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(McqAnswer)
    private readonly mcqAnswersRepository: Repository<McqAnswer>,
    private readonly assessmentsService: AssessmentsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly mcqQuestionService: McqQuestionService,
  ) {}

  /**
   * Return shuffled MCQ questions without correct answers.
   */
  async getQuestions(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<CandidateMcqQuestion[]> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_1) {
      throw new BadRequestException('MCQ round is not active');
    }

    const category = assessment.candidate.roleApplied;

    // Try to source questions from the Question Bank (mcq_questions) first
    let bankQuestions = [];
    try {
      bankQuestions = await this.mcqQuestionService.findForAssessment(category, 15);
    } catch {
      // Fallback if Question Bank service fails
    }

    let questions: any[];
    if (bankQuestions.length > 0) {
      // Sync Question Bank questions into questions table so submitAnswers and FKs work cleanly
      for (const bq of bankQuestions) {
        const existing = await this.questionsRepository.findOne({ where: { id: bq.id } });
        if (!existing) {
          await this.questionsRepository.save(
            this.questionsRepository.create({
              id: bq.id,
              type: QuestionType.MCQ,
              category: bq.topic || category,
              difficulty: bq.difficulty as any,
              text: bq.questionText,
              options: bq.options,
              correctAnswer: bq.correctAnswer,
              isActive: true,
            })
          );
        }
      }

      // Map Question Bank questions to the format expected by the live engine
      questions = this.shuffle([...bankQuestions]).map(q => ({
        id: q.id,
        type: QuestionType.MCQ,
        category: q.topic || category,
        difficulty: q.difficulty,
        text: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        codeStarter: null,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
    } else {
      // Fallback to the legacy questions table
      let rawQuestions = await this.questionsRepository
        .createQueryBuilder('question')
        .where('question.type = :type', { type: QuestionType.MCQ })
        .andWhere('question.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(question.category) = LOWER(:category)', { category })
        .orderBy('RANDOM()')
        .take(15)
        .getMany();

      if (rawQuestions.length === 0) {
        rawQuestions = await this.questionsRepository
          .createQueryBuilder('question')
          .where('question.type = :type', { type: QuestionType.MCQ })
          .andWhere('question.isActive = :isActive', { isActive: true })
          .orderBy('RANDOM()')
          .take(15)
          .getMany();
      }
      questions = rawQuestions;
    }

    const cacheEntry: Record<string, string[]> = {};
    const response = this.shuffle([...questions]).map((question) => {
      const shuffledOptions = this.shuffle([...(question.options ?? [])]);
      cacheEntry[question.id] = shuffledOptions;

      return {
        id: question.id,
        type: question.type,
        category: question.category,
        difficulty: question.difficulty,
        text: question.text,
        options: shuffledOptions,
        codeStarter: question.codeStarter,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      };
    });

    // Cache shuffled options in Redis with a 2-hour TTL (longer than assessment duration)
    await this.cacheManager.set(`mcq_options:${assessmentId}`, cacheEntry, 7200);

    return response;
  }

  /**
   * Score MCQ answers server-side and advance the assessment.
   */
  async submitAnswers(
    assessmentId: string,
    dto: SubmitMcqDto,
    user: JwtPayload,
  ): Promise<{ score: number; total: number; percentage: number }> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_1) {
      throw new BadRequestException('MCQ round is not active');
    }

    this.assessmentsService.validateTimeLimit(assessment, 'mcq');

    const cachedOptions = await this.cacheManager.get<Record<string, string[]>>(`mcq_options:${assessmentId}`) ?? {};
    let correctCount = 0;

    for (const answer of dto.answers) {
      const question = await this.questionsRepository.findOne({
        where: { id: answer.questionId, type: QuestionType.MCQ, isActive: true },
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const originalOptions = question.options ?? [];
      const displayedOptions = cachedOptions[question.id] ?? originalOptions;
      const selectedIndex = Number(answer.selectedOption);
      const selectedValue = displayedOptions[selectedIndex] ?? null;
      const correctValue =
        question.correctAnswer === null
          ? null
          : originalOptions[Number(question.correctAnswer)] ?? null;
      const isCorrect =
        selectedValue !== null &&
        correctValue !== null &&
        selectedValue === correctValue;

      if (isCorrect) {
        correctCount += 1;
      }

      const savedAnswer = this.mcqAnswersRepository.create({
        assessmentId,
        questionId: question.id,
        topic: question.category,
        selectedOption: answer.selectedOption,
        isCorrect,
      });

      await this.mcqAnswersRepository.save(savedAnswer);
    }

    const total = dto.answers.length;
    const percentage =
      total === 0 ? 0 : Number(((correctCount / total) * 100).toFixed(2));

    await this.assessmentsService.saveAssessment(assessment);
    await this.assessmentsService.advanceRound(assessmentId);
    
    // Cleanup cache after submission
    await this.cacheManager.del(`mcq_options:${assessmentId}`);

    return {
      score: correctCount,
      total,
      percentage,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
  }
}
