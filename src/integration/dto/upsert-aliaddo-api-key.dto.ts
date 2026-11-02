import { IsString, MinLength } from 'class-validator';

export class UpsertAliaddoApiKeyDto {
  @IsString()
  @MinLength(8)
  apiKey!: string;
}

