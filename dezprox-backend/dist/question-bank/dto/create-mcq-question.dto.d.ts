import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
export declare class CreateMcqQuestionDto {
    questionText: string;
    options: string[];
    correctAnswer: string;
    topic: string;
    roleApplied: string;
    difficulty?: Difficulty;
    status?: QuestionStatus;
}
