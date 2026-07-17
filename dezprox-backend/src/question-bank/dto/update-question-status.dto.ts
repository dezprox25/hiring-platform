import { IsEnum, IsNotEmpty } from 'class-validator';
import { QuestionStatus } from '../enums/question-status.enum';

export class UpdateQuestionStatusDto {
  @IsEnum(QuestionStatus)
  @IsNotEmpty()
  status: QuestionStatus;
}
