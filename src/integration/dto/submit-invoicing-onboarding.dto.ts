import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export type InvoicingOnboardingIdentificationType = 'NIT' | 'CC' | 'CE' | 'PASSPORT';
export type InvoicingOnboardingPersonType = 'NATURAL' | 'JURIDICA';
export type InvoicingOnboardingVatResponsibility = 'IVA' | 'INC' | 'NO_APLICA';

export type InvoicingOnboardingPdfFormat =
  | 'A4'
  | 'LETTER'
  | 'Estandar'
  | 'Azul'
  | 'Continental'
  | 'Indigo'
  | 'FacturaExportacion'
  | 'MediaCarta'
  | 'Tirilla';
export type InvoicingOnboardingCurrency = 'COP' | 'USD';

export type InvoicingOnboardingOperationType = 'ESTANDAR' | 'SALUD';

export type InvoicingOnboardingDefaultPaymentMean =
  | 'CASH'
  | 'CREDIT_TRANSFER'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'OTHER';

export type InvoicingOnboardingIssuerOperationType =
  | 'INDEPENDENT_DOCTOR'
  | 'IPS_CLINIC'
  | 'OFFICE_COMPANY';

export class SubmitInvoicingOnboardingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  legalName!: string;

  @IsIn(['NATURAL', 'JURIDICA'])
  personType!: InvoicingOnboardingPersonType;

  @IsString()
  @Matches(/^(NIT|CC|CE|PASSPORT)$/)
  identificationType!: InvoicingOnboardingIdentificationType;

  @IsString()
  @Matches(/^[0-9]{5,20}$/)
  identification!: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  @Matches(/^[0-9]{1,2}$/)
  digitCheck?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['INDEPENDENT_DOCTOR', 'IPS_CLINIC', 'OFFICE_COMPANY'])
  issuerOperationType?: InvoicingOnboardingIssuerOperationType;

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
  // uuid v4 (loose)
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

  @IsOptional()
  @IsIn(['IVA', 'INC', 'NO_APLICA'])
  vatResponsibility?: InvoicingOnboardingVatResponsibility;

  @IsOptional()
  @IsIn(['01', '04', 'ZA', 'ZZ'])
  vatResponsibilityCode?: '01' | '04' | 'ZA' | 'ZZ';

  // Aliaddo (opcional, se puede llenar por admin)
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

  // DIAN (opcional, se puede llenar por admin)
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  rangeInitial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rangeFinal?: number;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  validFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  validUntil?: string; // YYYY-MM-DD

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
  resolutionValidFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  resolutionValidUntil?: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastConsecutiveUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nextConsecutive?: number;

  // Defaults (opcional)
  @IsOptional()
  @IsIn(['A4', 'LETTER', 'Estandar', 'Azul', 'Continental', 'Indigo', 'FacturaExportacion', 'MediaCarta', 'Tirilla'])
  pdfFormat?: InvoicingOnboardingPdfFormat;

  @IsOptional()
  @IsIn(['ESTANDAR', 'SALUD'])
  operationType?: InvoicingOnboardingOperationType;

  @IsOptional()
  @IsIn(['09', '10', '11', '12', '15', '16'])
  typeOfOperation?: '09' | '10' | '11' | '12' | '15' | '16';

  @IsOptional()
  @IsIn(['COP', 'USD'])
  currency?: InvoicingOnboardingCurrency;

  @IsOptional()
  @IsIn(['CASH', 'CREDIT_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'OTHER'])
  defaultPaymentMean?: InvoicingOnboardingDefaultPaymentMean;

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

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsString()
  defaultMedicalService?: string;

  @IsOptional()
  @IsObject()
  defaultService?: Record<string, unknown>;

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
