import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReleaseResultDto {
  @IsBoolean()
  released: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}
