import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertFacilFacturaCredentialsDto {
  @IsString()
  @MinLength(8)
  apiKey!: string;

  @IsString()
  @MinLength(8)
  apiSecret!: string;

  @IsOptional()
  @IsIn(['TEST', 'PRODUCTION'])
  environment?: 'TEST' | 'PRODUCTION';
}
