import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class SaveInvoicingOnboardingDraftDto {
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(180)
  legalName?: string;

  @IsOptional()
  @IsIn(['NATURAL', 'JURIDICA'])
  personType?: 'NATURAL' | 'JURIDICA';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @Matches(/^(NIT|CC|CE|PASSPORT)$/)
  identificationType?: 'NIT' | 'CC' | 'CE' | 'PASSPORT';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @Matches(/^[0-9]{5,20}$/)
  identification?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @Matches(/^[0-9]{1,2}$/)
  digitCheck?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['INDEPENDENT_DOCTOR', 'IPS_CLINIC', 'OFFICE_COMPANY'])
  issuerOperationType?: 'INDEPENDENT_DOCTOR' | 'IPS_CLINIC' | 'OFFICE_COMPANY';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(8)
  countryCode?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(64)
  countryName?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(16)
  postalCode?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @Matches(/^[0-9a-fA-F-]{16,64}$/)
  rutImageId?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(180)
  rutFileName?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  address?: string;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  city?: string;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  department?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  departmentName?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(8)
  departmentCode?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  cityName?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(16)
  cityCode2?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  economicActivity?: string;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  regime?: string;

  @IsOptional()
  @IsIn(['48', '49'])
  regimeTypeCode?: '48' | '49';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  fiscalResponsibilities?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fiscalResponsibilitiesCodes?: string[];

  // Legacy (compat)
  @IsOptional()
  @IsIn(['IVA', 'INC', 'NO_APLICA'])
  vatResponsibility?: 'IVA' | 'INC' | 'NO_APLICA';

  @IsOptional()
  @IsIn(['01', '04', 'ZA', 'ZZ'])
  vatResponsibilityCode?: '01' | '04' | 'ZA' | 'ZZ';

  @IsOptional()
  @IsBoolean()
  aliaddoCompanyCreated?: boolean;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  aliaddoApiKey?: string;

  @IsOptional()
  @IsIn(['OWN', 'ALIADDO'])
  aliaddoSignatureMode?: 'OWN' | 'ALIADDO';

  @IsOptional()
  @IsBoolean()
  dianEnabled?: boolean;

  @IsOptional()
  @IsIn(['TEST', 'HABILITATION', 'PRODUCTION'])
  dianEnvironment?: 'TEST' | 'HABILITATION' | 'PRODUCTION';

  @IsOptional()
  @IsIn(['PENDING', 'UPLOADED', 'VALIDATED', 'EXPIRED', 'EXHAUSTED'])
  resolutionStatus?: 'PENDING' | 'UPLOADED' | 'VALIDATED' | 'EXPIRED' | 'EXHAUSTED';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  resolutionKey?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  resolutionPrefix?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  resolutionNumber?: number;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  technicalKey?: string;

  // Legacy (compat)
  @IsOptional()
  @IsNumber()
  @Min(0)
  rangeInitial?: number;

  // Legacy (compat)
  @IsOptional()
  @IsNumber()
  @Min(0)
  rangeFinal?: number;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  validFrom?: string;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  resolutionRangeInitial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  resolutionRangeFinal?: number;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  resolutionValidFrom?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  resolutionValidUntil?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastConsecutiveUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nextConsecutive?: number;

  @IsOptional()
  @IsIn(['A4', 'LETTER', 'Estandar', 'Azul', 'Continental', 'Indigo', 'FacturaExportacion', 'MediaCarta', 'Tirilla'])
  pdfFormat?: 'A4' | 'LETTER' | 'Estandar' | 'Azul' | 'Continental' | 'Indigo' | 'FacturaExportacion' | 'MediaCarta' | 'Tirilla';

  // Legacy (compat)
  @IsOptional()
  @IsIn(['ESTANDAR', 'SALUD'])
  operationType?: 'ESTANDAR' | 'SALUD';

  @IsOptional()
  @IsIn(['09', '10', '11', '12', '15', '16'])
  typeOfOperation?: '09' | '10' | '11' | '12' | '15' | '16';

  @IsOptional()
  @IsIn(['COP', 'USD'])
  currency?: 'COP' | 'USD';

  // Legacy (compat)
  @IsOptional()
  @IsIn(['CASH', 'CREDIT_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER'])
  defaultPaymentMean?: 'CASH' | 'CREDIT_TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'OTHER';

  @IsOptional()
  @IsIn(['10', '30', '48', '49'])
  paymentMeanCode?: '10' | '30' | '48' | '49';

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @MaxLength(64)
  paymentMeanName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentDays?: number;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  defaultMedicalService?: string;

  @IsOptional()
  @IsObject()
  defaultService?: Record<string, unknown>;

  // Legacy (compat)
  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  taxesWithholdingsHandling?: string;

  @IsOptional()
  @IsObject()
  defaultServiceTaxConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}
