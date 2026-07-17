import { McqQuestionService } from './mcq-question.service';
import { CodingQuestionService } from './coding-question.service';
import { CreateMcqQuestionDto } from './dto/create-mcq-question.dto';
import { UpdateMcqQuestionDto } from './dto/update-mcq-question.dto';
import { ListMcqQuestionsDto } from './dto/list-mcq-questions.dto';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';
import { ListCodingQuestionsDto } from './dto/list-coding-questions.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
export declare class QuestionBankController {
    private readonly mcqQuestionService;
    private readonly codingQuestionService;
    constructor(mcqQuestionService: McqQuestionService, codingQuestionService: CodingQuestionService);
    createMcq(dto: CreateMcqQuestionDto): Promise<import("./entities/mcq-question.entity").McqQuestion>;
    bulkImportMcq(csvString: string): Promise<import("./mcq-question.service").BulkImportResult>;
    findAllMcq(filters: ListMcqQuestionsDto): Promise<{
        data: {
            id: string;
            questionText: string;
            options: string[];
            topic: string;
            roleApplied: string;
            difficulty: import("./enums/difficulty.enum").Difficulty;
            status: import("./enums/question-status.enum").QuestionStatus;
            isDeleted: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneMcq(id: string): Promise<{
        id: string;
        questionText: string;
        options: string[];
        topic: string;
        roleApplied: string;
        difficulty: import("./enums/difficulty.enum").Difficulty;
        status: import("./enums/question-status.enum").QuestionStatus;
        isDeleted: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMcq(id: string, dto: UpdateMcqQuestionDto): Promise<import("./entities/mcq-question.entity").McqQuestion>;
    toggleMcqStatus(id: string, dto: UpdateQuestionStatusDto): Promise<import("./entities/mcq-question.entity").McqQuestion>;
    deleteMcq(id: string): Promise<void>;
    createCoding(dto: CreateCodingQuestionDto): Promise<import("./entities/coding-question.entity").CodingQuestion>;
    findAllCoding(filters: ListCodingQuestionsDto): Promise<{
        data: import("./entities/coding-question.entity").CodingQuestion[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneCoding(id: string): Promise<import("./entities/coding-question.entity").CodingQuestion>;
    updateCoding(id: string, dto: UpdateCodingQuestionDto): Promise<import("./entities/coding-question.entity").CodingQuestion>;
    toggleCodingStatus(id: string, dto: UpdateQuestionStatusDto): Promise<import("./entities/coding-question.entity").CodingQuestion>;
    deleteCoding(id: string): Promise<void>;
}
