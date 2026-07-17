import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMcqQuestionDto } from './create-mcq-question.dto';

export class BulkImportMcqDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMcqQuestionDto)
  rows: CreateMcqQuestionDto[];
}
