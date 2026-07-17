import { IsEnum } from 'class-validator';
import { CandidateStatus } from '../enums/candidate-status.enum';

export class UpdateStatusDto {
  @IsEnum(CandidateStatus)
  status: CandidateStatus;
}
