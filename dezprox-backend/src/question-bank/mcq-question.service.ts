import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McqQuestion } from './entities/mcq-question.entity';
import { CreateMcqQuestionDto } from './dto/create-mcq-question.dto';
import { ListMcqQuestionsDto } from './dto/list-mcq-questions.dto';
import { UpdateMcqQuestionDto } from './dto/update-mcq-question.dto';
import { Difficulty } from './enums/difficulty.enum';
import { QuestionStatus } from './enums/question-status.enum';

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class McqQuestionService {
  constructor(
    @InjectRepository(McqQuestion)
    private readonly mcqQuestionRepository: Repository<McqQuestion>,
  ) {}

  /**
   * Creates a new MCQ question.
   */
  async create(dto: CreateMcqQuestionDto): Promise<McqQuestion> {
    if (!dto.options.includes(dto.correctAnswer)) {
      throw new BadRequestException('Correct answer must be one of the options');
    }

    const question = this.mcqQuestionRepository.create(dto);
    return this.mcqQuestionRepository.save(question);
  }

  /**
   * Batch imports MCQ questions from a CSV string.
   */
  async bulkImport(csvString: string): Promise<BulkImportResult> {
    const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      throw new BadRequestException('CSV must include a header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);
    const validQuestions: McqQuestion[] = [];
    const errors: { row: number; message: string }[] = [];

    dataRows.forEach((line, index) => {
      const rowIndex = index + 2; // +1 for 0-index, +1 for header
      
      // Simple CSV split (handling basic quotes)
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => 
        v.trim().replace(/^"|"$/g, '')
      );

      if (values.length < 9) {
        errors.push({ row: rowIndex, message: 'Insufficient columns' });
        return;
      }

      const [
        questionText,
        option1,
        option2,
        option3,
        option4,
        correctAnswer,
        topic,
        roleApplied,
        difficultyStr,
      ] = values;

      const options = [option1, option2, option3, option4];
      
      if (!options.includes(correctAnswer)) {
        errors.push({ row: rowIndex, message: 'Correct answer not in options' });
        return;
      }

      let difficulty = Difficulty.MEDIUM;
      if (Object.values(Difficulty).includes(difficultyStr.toLowerCase() as Difficulty)) {
        difficulty = difficultyStr.toLowerCase() as Difficulty;
      }

      const question = this.mcqQuestionRepository.create({
        questionText,
        options,
        correctAnswer,
        topic,
        roleApplied,
        difficulty,
        status: QuestionStatus.ACTIVE,
      });

      validQuestions.push(question);
    });

    if (validQuestions.length === 0 && errors.length > 0) {
      throw new BadRequestException('All rows failed validation');
    }

    if (validQuestions.length > 0) {
      await this.mcqQuestionRepository.save(validQuestions);
    }

    return {
      imported: validQuestions.length,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Lists MCQ questions without correct answers.
   */
  async findAll(filters: ListMcqQuestionsDto) {
    const { status, topic, roleApplied, difficulty, page = 1, limit = 20 } = filters;
    const query = this.mcqQuestionRepository.createQueryBuilder('q');

    query.where('q.isDeleted = :isDeleted', { isDeleted: false });

    if (status) query.andWhere('q.status = :status', { status });
    if (topic) query.andWhere('LOWER(q.topic) = LOWER(:topic)', { topic });
    if (roleApplied) query.andWhere('LOWER(q.roleApplied) = LOWER(:roleApplied)', { roleApplied });
    if (difficulty) query.andWhere('q.difficulty = :difficulty', { difficulty });

    const [items, total] = await query
      .orderBy('q.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Map to safe DTO (correctAnswer already excluded via @Exclude on entity, 
    // but we can be explicit here too)
    const data = items.map(({ correctAnswer, ...rest }) => rest);

    return { data, total, page, limit };
  }

  /**
   * Internal method: find one INCLUDING correct answer.
   */
  async findOne(id: string): Promise<McqQuestion> {
    const question = await this.mcqQuestionRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  /**
   * External method: find one EXCLUDING correct answer.
   */
  async findOneSafe(id: string) {
    const { correctAnswer, ...safeQuestion } = await this.findOne(id);
    return safeQuestion;
  }

  /**
   * Internal method: random selection for assessment.
   */
  async findForAssessment(roleApplied: string, limit: number): Promise<McqQuestion[]> {
    return this.mcqQuestionRepository
      .createQueryBuilder('q')
      .where('q.status = :status', { status: QuestionStatus.ACTIVE })
      .andWhere('q.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('LOWER(q.roleApplied) = LOWER(:role)', { roleApplied })
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
  }

  async update(id: string, dto: UpdateMcqQuestionDto): Promise<McqQuestion> {
    const question = await this.findOne(id);
    
    if (dto.options && dto.correctAnswer) {
      if (!dto.options.includes(dto.correctAnswer)) {
        throw new BadRequestException('Correct answer must be one of the options');
      }
    } else if (dto.options) {
      if (!dto.options.includes(question.correctAnswer)) {
        throw new BadRequestException('New options must include the existing correct answer');
      }
    } else if (dto.correctAnswer) {
      if (!question.options.includes(dto.correctAnswer)) {
        throw new BadRequestException('New correct answer must be one of the existing options');
      }
    }

    Object.assign(question, dto);
    return this.mcqQuestionRepository.save(question);
  }

  async toggleStatus(id: string, status: QuestionStatus): Promise<McqQuestion> {
    const question = await this.findOne(id);
    question.status = status;
    return this.mcqQuestionRepository.save(question);
  }

  async softDelete(id: string): Promise<void> {
    const question = await this.findOne(id);
    question.isDeleted = true;
    await this.mcqQuestionRepository.save(question);
  }
}
