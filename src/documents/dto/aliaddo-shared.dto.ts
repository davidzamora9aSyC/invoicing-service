import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AliaddoBranchDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  countryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  departamentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  departamentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  cityCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  cityName?: string;
}

export class AliaddoResolutionDto {
  @IsNotEmpty()
  @IsString()
  resolutionKey!: string;

  @IsNotEmpty()
  @IsString()
  resolutionPrefix!: string;

  @IsDefined()
  @IsNumber()
  resolutionNumber!: number;

  @IsDefined()
  @IsNumber()
  resolutionRangeInitial!: number;

  @IsDefined()
  @IsNumber()
  resolutionRangeFinal!: number;

  @IsNotEmpty()
  @IsString()
  resolutionValidFrom!: string;

  @IsNotEmpty()
  @IsString()
  resolutionValidUntil!: string;
}

export class AliaddoThirdPartyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  companyName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  personType!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  regimeType!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(24)
  identification!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  digitCheck!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(4)
  identificationTypeCode!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  merchantRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  responsibleFor?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  responsibilities!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  economicActivities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  billingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  billingCountryName?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  billingCountryCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  billingRegionName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingRegionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  billingCityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingCityCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  billingNeighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  billingPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  billingContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  shippingCountryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  shippingCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  shippingRegionName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  shippingRegionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(48)
  shippingCityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  shippingCityCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  shippingNeighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  shippingPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  shippingContactName?: string;
}

export class AliaddoDiscountDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  type!: string;

  @IsDefined()
  @IsNumber()
  rate!: number;

  @IsDefined()
  @IsNumber()
  amount!: number;
}

export class AliaddoChargeDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  type!: string;

  @IsDefined()
  @IsNumber()
  rate!: number;

  @IsDefined()
  @IsNumber()
  amount!: number;
}

export class AliaddoTaxDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  code!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  type!: string;

  @IsDefined()
  @IsNumber()
  rate!: number;

  @IsDefined()
  @IsNumber()
  amount!: number;
}

export class AliaddoMandanteDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(24)
  identification!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  digitCheck!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(4)
  identificationTypeCode!: string;
}

export class AliaddoTotalDto {
  @IsDefined()
  @IsNumber()
  amount!: number;

  @IsDefined()
  @IsNumber()
  prepaymentAmount!: number;
}

export class AliaddoCustomFieldDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  value?: string;
}

export class AliaddoDetailDto {
  @IsOptional()
  @IsString()
  @MaxLength(3)
  standardType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  standardCode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  itemCode!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  itemName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  itemModel?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  itemCodeSupplier?: string;

  @IsDefined()
  @IsBoolean()
  isPresent!: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(4)
  unitMeasurementCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  unitMeasurementName?: string;

  @IsDefined()
  @IsNumber()
  price!: number;

  @IsDefined()
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoDiscountDto)
  discounts?: AliaddoDiscountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoChargeDto)
  charges?: AliaddoChargeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoTaxDto)
  taxes?: AliaddoTaxDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoTaxDto)
  withholdings?: AliaddoTaxDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AliaddoMandanteDto)
  isvMandante?: AliaddoMandanteDto;
}

export class AliaddoInvoiceBaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  emailSender?: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  consecutive!: number;

  @IsOptional()
  @IsString()
  externalNumber?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  currencyCode!: string;

  @IsDefined()
  @IsNumber()
  currencyRate!: number;

  @IsNotEmpty()
  @IsString()
  date!: string;

  @IsOptional()
  @IsString()
  dateStart?: string;

  @IsOptional()
  @IsString()
  dateEnd?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  typeOfOperation!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AliaddoBranchDto)
  branch?: AliaddoBranchDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AliaddoResolutionDto)
  resolution!: AliaddoResolutionDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AliaddoThirdPartyDto)
  customer!: AliaddoThirdPartyDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AliaddoDetailDto)
  invoiceDetails!: AliaddoDetailDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AliaddoTotalDto)
  totals!: AliaddoTotalDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoDiscountDto)
  discounts?: AliaddoDiscountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoChargeDto)
  charges?: AliaddoChargeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AliaddoCustomFieldDto)
  customFields?: AliaddoCustomFieldDto[];
}

