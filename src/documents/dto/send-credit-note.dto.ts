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
  AliaddoCustomFieldDto,
  AliaddoDetailDto,
  AliaddoDiscountDto,
  AliaddoResolutionDto,
  AliaddoThirdPartyDto,
  AliaddoTotalDto,
} from './aliaddo-shared.dto';

export class SendCreditNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  emailSender?: string;

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

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  typeOfOperation!: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  terms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  remark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  observation?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  invoicePrefix!: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  invoiceConsecutive!: number;

  @IsNotEmpty()
  @IsString()
  invoiceCufe!: string;

  @IsNotEmpty()
  @IsString()
  invoiceDate!: string;

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
  invoiceNoteDetails!: AliaddoDetailDto[];

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

