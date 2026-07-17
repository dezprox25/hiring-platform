import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { ProgrammingLanguage } from '../../assessments/enums/programming-language.enum';
export declare class ListCodingQuestionsDto {
    status?: QuestionStatus;
    language?: ProgrammingLanguage;
    difficulty?: Difficulty;
    page?: number;
    limit?: number;
}
