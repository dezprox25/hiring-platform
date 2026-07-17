import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
export declare class ListMcqQuestionsDto {
    status?: QuestionStatus;
    topic?: string;
    roleApplied?: string;
    difficulty?: Difficulty;
    page?: number;
    limit?: number;
}
