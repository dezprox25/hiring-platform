import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { ProgrammingLanguage } from '../../assessments/enums/programming-language.enum';

export class ListCodingQuestionsDto {
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsEnum(ProgrammingLanguage)
  @IsOptional()
  language?: ProgrammingLanguage;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
