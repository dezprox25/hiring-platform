import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ProgrammingLanguage } from '../enums/programming-language.enum';

export class SubmitCodingDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @IsInt()
  @Min(1)
  timeTakenSeconds: number;
}
