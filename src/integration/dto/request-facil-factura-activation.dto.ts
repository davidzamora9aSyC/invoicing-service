import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RequestFacilFacturaActivationDto {
  @IsIn(['INVOICE', 'RIPS', 'BOTH'])
  scope!: 'INVOICE' | 'RIPS' | 'BOTH';

  @IsString()
  @MinLength(2)
  legalName!: string;

  @IsEmail()
  email!: string;

  @IsIn(['NIT', 'CC', 'CE', 'PASSPORT'])
  identificationType!: 'NIT' | 'CC' | 'CE' | 'PASSPORT';

  @IsString()
  @MinLength(3)
  identification!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  rutImageId!: string;

  @IsOptional()
  @IsString()
  rutFileName?: string;

  @IsOptional()
  @IsString()
  resolutionPdfImageId?: string;

  @IsOptional()
  @IsString()
  resolutionPdfFileName?: string;

  @IsOptional()
  @IsString()
  resolutionPrefix?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionRangeInitial?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resolutionRangeFinal?: number;

  @IsOptional()
  @IsString()
  resolutionValidFrom?: string;

  @IsOptional()
  @IsString()
  resolutionValidUntil?: string;
}
