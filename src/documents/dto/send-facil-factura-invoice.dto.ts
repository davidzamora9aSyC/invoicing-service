import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsObject, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class FacilFacturaTaxDto {
  @IsString()
  @MinLength(1)
  tax_category!: string;

  @IsNumber()
  tax_rate!: number;
}

export class FacilFacturaItemDto {
  @IsString()
  @MinLength(1)
  sku!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilFacturaTaxDto)
  taxes?: FacilFacturaTaxDto[];
}

export class FacilFacturaCustomerDto {
  @IsString()
  @MinLength(1)
  party_identification_type!: string;

  @IsString()
  @MinLength(1)
  party_identification!: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address_line?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class FacilFacturaNumberingDto {
  @IsString()
  @MinLength(1)
  prefix!: string;

  @IsString()
  @MinLength(1)
  resolution_number!: string;
}

export class SendFacilFacturaInvoiceDto {
  @IsString()
  @MinLength(1)
  number!: string;

  @IsString()
  @MinLength(8)
  issue_date!: string;

  @IsIn(['DEBITO', 'CREDITO'])
  payment_means_type!: 'DEBITO' | 'CREDITO';

  @IsString()
  @MinLength(1)
  payment_means!: string;

  @ValidateNested()
  @Type(() => FacilFacturaNumberingDto)
  numbering!: FacilFacturaNumberingDto;

  @ValidateNested()
  @Type(() => FacilFacturaCustomerDto)
  customer!: FacilFacturaCustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilFacturaItemDto)
  items!: FacilFacturaItemDto[];
}

export class SendFacilFacturaHealthInvoiceDto extends SendFacilFacturaInvoiceDto {
  @IsObject()
  health!: Record<string, unknown>;

  @IsObject()
  rips!: Record<string, unknown>;
}
