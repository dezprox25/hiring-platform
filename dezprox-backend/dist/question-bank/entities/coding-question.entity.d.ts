import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { ProgrammingLanguage } from '../../assessments/enums/programming-language.enum';
export declare class CodingQuestion {
    id: string;
    prompt: string;
    language: ProgrammingLanguage;
    difficulty: Difficulty;
    status: QuestionStatus;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
