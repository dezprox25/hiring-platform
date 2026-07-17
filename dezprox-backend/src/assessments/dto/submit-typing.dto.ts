import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class SubmitTypingDto {
  @IsString()
  @IsNotEmpty()
  typedText: string;

  @IsInt()
  @Min(1)
  timeTakenSeconds: number;

  @IsString()
  passage: string;
}
