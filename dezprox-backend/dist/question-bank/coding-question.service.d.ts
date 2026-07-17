import { Repository } from 'typeorm';
import { CodingQuestion } from './entities/coding-question.entity';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { ListCodingQuestionsDto } from './dto/list-coding-questions.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';
import { ProgrammingLanguage } from '../assessments/enums/programming-language.enum';
import { QuestionStatus } from './enums/question-status.enum';
export declare class CodingQuestionService {
    private readonly codingQuestionRepository;
    constructor(codingQuestionRepository: Repository<CodingQuestion>);
    create(dto: CreateCodingQuestionDto): Promise<CodingQuestion>;
    findAll(filters: ListCodingQuestionsDto): Promise<{
        data: CodingQuestion[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<CodingQuestion>;
    findOneActive(language: ProgrammingLanguage): Promise<CodingQuestion | null>;
    update(id: string, dto: UpdateCodingQuestionDto): Promise<CodingQuestion>;
    toggleStatus(id: string, status: QuestionStatus): Promise<CodingQuestion>;
    softDelete(id: string): Promise<void>;
}
