import { IsBoolean, IsOptional } from 'class-validator';

export class RetriggerEvaluationDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;
}
