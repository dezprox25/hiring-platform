import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';

export class ListMcqQuestionsDto {
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  roleApplied?: string;

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
