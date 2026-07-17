import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class McqAnswerItemDto {
  @IsString()
  questionId: string;

  @IsString()
  selectedOption: string;
}

export class SubmitMcqDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => McqAnswerItemDto)
  @IsObject({ each: true })
  answers: McqAnswerItemDto[];
}
