import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

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
}
