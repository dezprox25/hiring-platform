import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { ProgrammingLanguage } from '../../assessments/enums/programming-language.enum';

export class CreateCodingQuestionDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsEnum(ProgrammingLanguage)
  @IsNotEmpty()
  language: ProgrammingLanguage;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;
}
