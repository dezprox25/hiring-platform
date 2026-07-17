import { PartialType } from '@nestjs/mapped-types';
import { CreateCodingQuestionDto } from './create-coding-question.dto';

export class UpdateCodingQuestionDto extends PartialType(CreateCodingQuestionDto) {}
