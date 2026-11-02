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
  AliaddoThirdPartyDto,
  AliaddoTotalDto,
} from './aliaddo-shared.dto';

export class SendSupportAdjustmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1)
  concept!: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  consecutive!: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  supportDocumentPrefix!: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  supportDocumentConsecutive!: number;

  @IsNotEmpty()
  @IsString()
  supportDocumentCuds!: string;

  @IsNotEmpty()
  @IsString()
  supportDocumentDate!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AliaddoBranchDto)
  branch?: AliaddoBranchDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AliaddoThirdPartyDto)
  supplier!: AliaddoThirdPartyDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AliaddoDetailDto)
  supportDocumentAdjustmentDetails!: AliaddoDetailDto[];

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

