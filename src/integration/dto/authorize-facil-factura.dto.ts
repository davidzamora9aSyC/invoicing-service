import { IsIn, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';

const hasText = (_: unknown, value: unknown) => typeof value === 'string' && value.trim().length > 0;

export class AuthorizeFacilFacturaDto {
  @IsOptional()
  @ValidateIf(hasText)
  @IsString()
  @MinLength(8)
  testApiKey?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsString()
  @MinLength(8)
  testApiSecret?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsString()
  @MinLength(8)
  productionApiKey?: string;

  @IsOptional()
  @ValidateIf(hasText)
  @IsString()
  @MinLength(8)
  productionApiSecret?: string;

  @IsIn(['TEST', 'PRODUCTION'])
  activeEnvironment!: 'TEST' | 'PRODUCTION';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectFacilFacturaDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PrepareFacilFacturaDto extends AuthorizeFacilFacturaDto {
  @IsIn(['DOCTOR', 'CLINIC'])
  issuerType!: 'DOCTOR' | 'CLINIC';

  @IsUUID()
  issuerId!: string;

  @IsOptional()
  @IsIn(['INVOICE', 'RIPS', 'BOTH'])
  scope?: 'INVOICE' | 'RIPS' | 'BOTH';
}
