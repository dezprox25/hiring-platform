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
    errors: {
        row: number;
        message: string;
    }[];
}
export declare class McqQuestionService {
    private readonly mcqQuestionRepository;
    constructor(mcqQuestionRepository: Repository<McqQuestion>);
    create(dto: CreateMcqQuestionDto): Promise<McqQuestion>;
    bulkImport(csvString: string): Promise<BulkImportResult>;
    findAll(filters: ListMcqQuestionsDto): Promise<{
        data: {
            id: string;
            questionText: string;
            options: string[];
            topic: string;
            roleApplied: string;
            difficulty: Difficulty;
            status: QuestionStatus;
            isDeleted: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<McqQuestion>;
    findOneSafe(id: string): Promise<{
        id: string;
        questionText: string;
        options: string[];
        topic: string;
        roleApplied: string;
        difficulty: Difficulty;
        status: QuestionStatus;
        isDeleted: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findForAssessment(roleApplied: string, limit: number): Promise<McqQuestion[]>;
    update(id: string, dto: UpdateMcqQuestionDto): Promise<McqQuestion>;
    toggleStatus(id: string, status: QuestionStatus): Promise<McqQuestion>;
    softDelete(id: string): Promise<void>;
}
