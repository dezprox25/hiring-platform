import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Recommendation } from '../enums/recommendation.enum';

export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsString()
  technicalComment?: string;

  @IsOptional()
  @IsString()
  communicationComment?: string;

  @IsEnum(Recommendation)
  recommendation: Recommendation;
}
