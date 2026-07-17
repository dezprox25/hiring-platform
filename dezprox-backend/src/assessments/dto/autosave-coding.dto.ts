import { IsString } from 'class-validator';

export class AutosaveCodingDto {
  @IsString()
  draftCode: string;
}
