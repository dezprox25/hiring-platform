import { IsOptional, IsDateString, IsString } from 'class-validator';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  roleApplied?: string;
}
