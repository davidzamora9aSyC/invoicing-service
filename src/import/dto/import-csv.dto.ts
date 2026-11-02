import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ImportCsvDto {
  @IsString()
  @MinLength(1)
  csvText!: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

