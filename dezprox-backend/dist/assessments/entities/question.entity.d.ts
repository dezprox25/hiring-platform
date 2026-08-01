import { User } from '../../users/entities/user.entity';
import { QuestionType } from '../enums/question-type.enum';
export declare enum QuestionDifficulty {
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard"
}
export declare class Question {
    id: string;
    type: QuestionType;
    category: string;
    difficulty: QuestionDifficulty;
    text: string;
    options: string[] | null;
    correctAnswer: string | null;
    codeStarter: string | null;
    isActive: boolean;
    createdById: string | null;
    createdBy: User | null;
    createdAt: Date;
    updatedAt: Date;
}
