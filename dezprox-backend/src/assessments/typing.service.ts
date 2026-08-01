import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { SubmitTypingDto } from './dto/submit-typing.dto';
import { TypingResult } from './entities/typing-result.entity';
import { AssessmentStatus } from './enums/assessment-status.enum';
import { Question } from './entities/question.entity';
import { QuestionType } from './enums/question-type.enum';

@Injectable()
export class TypingService {
  private readonly defaultPassages = [
    'Clear communication helps teams ship reliable software with fewer misunderstandings and faster feedback loops.',
    'A strong developer writes code that is easy to read, easy to maintain, and easy to improve over time.',
    'Hiring decisions improve when technical skill, collaboration, and ownership are reviewed together instead of separately.',
    'Frontend applications should balance user experience, performance, accessibility, and maintainable architecture.',
    'Backend services need predictable validation, helpful errors, and dependable logging to support production systems.',
    'Well scoped features reduce risk because teams can review, test, and release them without large unexpected changes.',
    'Good engineering habits include documenting tradeoffs, naming things clearly, and checking assumptions early.',
    'Code reviews are more effective when comments are specific, respectful, and focused on behavior rather than style.',
    'Reliable systems are built by making failures visible, recoverable, and simple to understand under pressure.',
    'Assessment platforms should evaluate practical thinking, clear structure, and communication rather than trivia alone.',
  ];

  constructor(
    @InjectRepository(TypingResult)
    private readonly typingResultsRepository: Repository<TypingResult>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly assessmentsService: AssessmentsService,
  ) {}

  /**
   * Return the typing passage for the active assessment.
   */
  async getPassage(
    assessmentId: string,
    user: JwtPayload,
  ): Promise<{ passage: string }> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_2) {
      throw new BadRequestException('Typing round is not active');
    }

    return { passage: await this.resolvePassage(assessmentId) };
  }

  /**
   * Calculate WPM, accuracy, and mistakes on the server.
   */
  calculateWpm(
    typedText: string,
    passage: string,
    timeTakenSeconds: number,
  ): { wpm: number; accuracy: number; mistakes: number } {
    const trimmed = typedText.trim();
    const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
    const wpm = Math.round((wordCount / timeTakenSeconds) * 60);

    let mistakes = 0;
    const comparisonLength = Math.max(typedText.length, passage.length);
    for (let index = 0; index < comparisonLength; index += 1) {
      if ((typedText[index] ?? '') !== (passage[index] ?? '')) {
        mistakes += 1;
      }
    }

    const accuracyBase =
      passage.length === 0 ? 100 : ((passage.length - mistakes) / passage.length) * 100;

    return {
      wpm,
      accuracy: Number(Math.max(0, accuracyBase).toFixed(2)),
      mistakes,
    };
  }

  /**
   * Save typing results, update assessment metrics, and advance the assessment.
   */
  async submitTyping(
    assessmentId: string,
    dto: SubmitTypingDto,
    user: JwtPayload,
  ): Promise<TypingResult> {
    const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);

    if (assessment.status !== AssessmentStatus.ROUND_2) {
      throw new BadRequestException('Typing round is not active');
    }

    this.assessmentsService.validateTimeLimit(assessment, 'typing');

    const expectedPassage = await this.resolvePassage(assessmentId);
    const metrics = this.calculateWpm(dto.typedText, expectedPassage, dto.timeTakenSeconds);
    const existing = await this.typingResultsRepository.findOne({ where: { assessmentId } });
    const result = existing ?? this.typingResultsRepository.create({ assessmentId });

    result.passage = expectedPassage;
    result.typedText = dto.typedText;
    result.timeTakenSeconds = dto.timeTakenSeconds;
    result.wpm = metrics.wpm;
    result.accuracy = metrics.accuracy;
    result.mistakes = metrics.mistakes;

    const saved = await this.typingResultsRepository.save(result);
    await this.assessmentsService.saveAssessment(assessment);
    await this.assessmentsService.advanceRound(assessmentId);

    return saved;
  }

  private async resolvePassage(assessmentId: string): Promise<string> {
    const dbPassages = await this.questionsRepository.find({
      where: { type: QuestionType.TYPING, isActive: true },
      order: { id: 'ASC' },
    });

    const list = dbPassages.length > 0 ? dbPassages.map((q) => q.text) : this.defaultPassages;
    const numericSeed = Number.parseInt(assessmentId.replace(/-/g, '').slice(0, 8), 16);
    const index = Number.isNaN(numericSeed) ? 0 : numericSeed % list.length;
    return list[index];
  }
}
