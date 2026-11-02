import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AliaddoInvoiceBaseDto } from './aliaddo-shared.dto';

export class SendInvoiceDto extends AliaddoInvoiceBaseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  code!: string;

  @IsOptional()
  @IsString()
  dateDue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  dueDiligence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  incoterms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  deliveryTerms?: string;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  termDay?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  paymentMeanCode?: string;
}
