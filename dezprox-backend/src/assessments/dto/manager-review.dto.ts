import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class ManagerReviewDto {
  @IsInt()
  @Min(0)
  @Max(100)
  managerScore: number;

  @IsString()
  @IsNotEmpty()
  managerFeedback: string;
}
