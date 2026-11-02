import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AliaddoBranchDto,
  AliaddoChargeDto,
  AliaddoDetailDto,
  AliaddoDiscountDto,
  AliaddoResolutionDto,
  AliaddoThirdPartyDto,
  AliaddoTotalDto,
} from './aliaddo-shared.dto';

export class SendSupportDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  consecutive!: number;

  @IsOptional()
  @IsString()
  @MaxLength(42)
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
  dateDue?: string;

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
  @IsString()
  @MaxLength(800)
  observation?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  termDay?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  paymentMeanCode?: string;

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
  supplier!: AliaddoThirdPartyDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AliaddoDetailDto)
  supportDocumentDetails!: AliaddoDetailDto[];

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
}

