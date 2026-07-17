import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodingQuestion } from './entities/coding-question.entity';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { ListCodingQuestionsDto } from './dto/list-coding-questions.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';
import { ProgrammingLanguage } from '../assessments/enums/programming-language.enum';
import { QuestionStatus } from './enums/question-status.enum';

@Injectable()
export class CodingQuestionService {
  constructor(
    @InjectRepository(CodingQuestion)
    private readonly codingQuestionRepository: Repository<CodingQuestion>,
  ) {}

  async create(dto: CreateCodingQuestionDto): Promise<CodingQuestion> {
    const question = this.codingQuestionRepository.create(dto);
    return this.codingQuestionRepository.save(question);
  }

  async findAll(filters: ListCodingQuestionsDto) {
    const { status, language, difficulty, page = 1, limit = 20 } = filters;
    const query = this.codingQuestionRepository.createQueryBuilder('q');

    query.where('q.isDeleted = :isDeleted', { isDeleted: false });

    if (status) query.andWhere('q.status = :status', { status });
    if (language) query.andWhere('q.language = :language', { language });
    if (difficulty) query.andWhere('q.difficulty = :difficulty', { difficulty });

    const [data, total] = await query
      .orderBy('q.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<CodingQuestion> {
    const question = await this.codingQuestionRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!question) throw new NotFoundException('Coding question not found');
    return question;
  }

  /**
   * Internal method: picks an active coding question for the assessment.
   */
  async findOneActive(language: ProgrammingLanguage): Promise<CodingQuestion | null> {
    return this.codingQuestionRepository.findOne({
      where: {
        language,
        status: QuestionStatus.ACTIVE,
        isDeleted: false,
      },
      order: { createdAt: 'DESC' }, // Pick the newest one
    });
  }

  async update(id: string, dto: UpdateCodingQuestionDto): Promise<CodingQuestion> {
    const question = await this.findOne(id);
    Object.assign(question, dto);
    return this.codingQuestionRepository.save(question);
  }

  async toggleStatus(id: string, status: QuestionStatus): Promise<CodingQuestion> {
    const question = await this.findOne(id);
    question.status = status;
    return this.codingQuestionRepository.save(question);
  }

  async softDelete(id: string): Promise<void> {
    const question = await this.findOne(id);
    question.isDeleted = true;
    await this.codingQuestionRepository.save(question);
  }
}
