import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
export declare class McqQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    topic: string;
    roleApplied: string;
    difficulty: Difficulty;
    status: QuestionStatus;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
