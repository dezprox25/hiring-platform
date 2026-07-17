import { PartialType } from '@nestjs/mapped-types';
import { CreateMcqQuestionDto } from './create-mcq-question.dto';

export class UpdateMcqQuestionDto extends PartialType(CreateMcqQuestionDto) {}
