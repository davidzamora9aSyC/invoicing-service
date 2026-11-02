import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IntegrationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IssuerService, Role } from '../issuer/issuer.service';
import { IntegrationSecretsService } from './integration-secrets.service';
import { SubmitInvoicingOnboardingDto } from './dto/submit-invoicing-onboarding.dto';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { SaveInvoicingOnboardingDraftDto } from './dto/save-invoicing-onboarding-draft.dto';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly issuerService: IssuerService,
    private readonly secrets: IntegrationSecretsService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async getMe(role: Role | undefined, subjectId: string | undefined) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    return this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: issuer },
      select: integrationSafeSelect,
    });
  }

  async upsertDianTestSetId(role: Role | undefined, subjectId: string | undefined, dianTestSetId: string) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    if (!dianTestSetId?.trim()) {
      throw new BadRequestException('Missing dianTestSetId');
    }
    const data: Prisma.IssuerIntegrationUncheckedCreateInput = {
      issuerType: issuer.issuerType,
      issuerId: issuer.issuerId,
      dianTestSetId: dianTestSetId.trim(),
      status: 'IN_HABILITATION',
    };
    const updated = await this.prisma.issuerIntegration.upsert({
      where: { issuerType_issuerId: issuer },
      create: data,
      update: {
        dianTestSetId: data.dianTestSetId,
        status: data.status,
      },
      select: integrationSafeSelect,
    });
    return updated;
  }

  async submitOnboardingMe(
    role: Role | undefined,
    subjectId: string | undefined,
    dto: SubmitInvoicingOnboardingDto,
  ) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const legalName = dto.legalName?.trim();
    const personType = dto.personType?.trim();
    const identificationType = dto.identificationType?.trim();
    const identification = dto.identification?.trim();
    const email = dto.email?.trim().toLowerCase();
    if (!legalName || !personType || !identificationType || !identification || !email) {
      throw new BadRequestException('Missing required onboarding fields');
    }

    const existing = await this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: issuer },
      select: {
        id: true,
        status: true,
        onboardingData: true,
        onboardingReviewedAt: true,
      },
    });

    const normalizedDto: SubmitInvoicingOnboardingDto = {
      ...dto,
      legalName,
      personType: personType as SubmitInvoicingOnboardingDto['personType'],
      identificationType: identificationType as SubmitInvoicingOnboardingDto['identificationType'],
      identification,
      digitCheck: dto.digitCheck?.trim() || undefined,
      email,
      phone: dto.phone?.trim() || undefined,
      countryCode: dto.countryCode?.trim() || undefined,
      countryName: dto.countryName?.trim() || undefined,
      postalCode: dto.postalCode?.trim() || undefined,
      rutImageId: dto.rutImageId?.trim() || undefined,
      rutFileName: dto.rutFileName?.trim() || undefined,
      departmentName: dto.departmentName?.trim() || (dto.department?.trim() || undefined),
      departmentCode: dto.departmentCode?.trim() || undefined,
      cityName: dto.cityName?.trim() || (dto.city?.trim() || undefined),
      cityCode2: dto.cityCode2?.trim() || undefined,
      fiscalResponsibilities: dto.fiscalResponsibilities?.trim() || undefined,
      fiscalResponsibilitiesCodes: dto.fiscalResponsibilitiesCodes,
      regimeTypeCode: dto.regimeTypeCode,
      vatResponsibilityCode:
        dto.vatResponsibilityCode ??
        (dto.vatResponsibility === 'IVA' ? '01' : dto.vatResponsibility === 'INC' ? '04' : 'ZZ'),
      resolutionKey: dto.resolutionKey?.trim() || (dto.technicalKey?.trim() || undefined),
      resolutionPrefix: dto.resolutionPrefix?.trim() || undefined,
      resolutionValidFrom: dto.resolutionValidFrom?.trim() || (dto.validFrom?.trim() || undefined),
      resolutionValidUntil: dto.resolutionValidUntil?.trim() || (dto.validUntil?.trim() || undefined),
      resolutionRangeInitial: dto.resolutionRangeInitial ?? dto.rangeInitial,
      resolutionRangeFinal: dto.resolutionRangeFinal ?? dto.rangeFinal,
      paymentMeanName: dto.paymentMeanName?.trim() || undefined,
    };

    const shouldRequestReview = !existing
      ? true
      : needsReviewForOnboardingChange(existing.onboardingData, normalizedDto);

    const data: Prisma.IssuerIntegrationUncheckedCreateInput = {
      issuerType: issuer.issuerType,
      issuerId: issuer.issuerId,
      status: IntegrationStatus.PENDING_DIAN,
      onboardingData: normalizedDto as unknown as Prisma.InputJsonValue,
      onboardingSubmittedAt: new Date(),
    };

    return this.prisma.issuerIntegration.upsert({
      where: { issuerType_issuerId: issuer },
      create: data,
      update: {
        onboardingData: data.onboardingData,
        onboardingSubmittedAt: data.onboardingSubmittedAt,
        status: shouldRequestReview ? IntegrationStatus.PENDING_DIAN : (existing?.status ?? IntegrationStatus.PENDING_DIAN),
      },
      select: integrationSafeSelect,
    });
  }

  async saveOnboardingDraftMe(
    role: Role | undefined,
    subjectId: string | undefined,
    dto: SaveInvoicingOnboardingDraftDto,
  ) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const existing = await this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: issuer },
      select: {
        id: true,
        status: true,
        onboardingData: true,
        onboardingReviewedAt: true,
      },
    });

    const merged = {
      ...(existing?.onboardingData && typeof existing.onboardingData === 'object'
        ? (existing.onboardingData as Record<string, unknown>)
        : {}),
      ...dto,
    };

    const data: Prisma.IssuerIntegrationUncheckedCreateInput = {
      issuerType: issuer.issuerType,
      issuerId: issuer.issuerId,
      status: existing?.status ?? IntegrationStatus.NOT_CONFIGURED,
      onboardingData: merged as unknown as Prisma.InputJsonValue,
      onboardingDraftUpdatedAt: new Date(),
    };

    return this.prisma.issuerIntegration.upsert({
      where: { issuerType_issuerId: issuer },
      create: data,
      update: {
        onboardingData: data.onboardingData,
        onboardingDraftUpdatedAt: data.onboardingDraftUpdatedAt,
      },
      select: integrationSafeSelect,
    });
  }

  async listPendingOnboardingAdmin(role: Role | undefined, authUserId: string | undefined, params?: { limit?: number; page?: number }) {
    assertAdmin(role);
    if (!authUserId?.trim()) {
      throw new BadRequestException('Missing authUserId');
    }
    const limit = Math.min(Math.max(params?.limit ?? 25, 1), 100);
    const page = Math.max(params?.page ?? 1, 1);
    const skip = (page - 1) * limit;
    const where: Prisma.IssuerIntegrationWhereInput = {
      onboardingSubmittedAt: { not: null },
      status: { in: [IntegrationStatus.PENDING_DIAN, IntegrationStatus.IN_HABILITATION] },
    };
    const [items, total] = await Promise.all([
      this.prisma.issuerIntegration.findMany({
        where,
        orderBy: { onboardingSubmittedAt: 'desc' },
        skip,
        take: limit,
        select: integrationSafeSelect,
      }),
      this.prisma.issuerIntegration.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async reviewOnboardingAdmin(input: {
    role: Role | undefined;
    authUserId: string | undefined;
    integrationId: string;
    approve: boolean;
    notes?: string;
    aliaddoApiKey?: string;
  }) {
    assertAdmin(input.role);
    const reviewerId = input.authUserId?.trim();
    if (!reviewerId) {
      throw new BadRequestException('Missing authUserId');
    }
    const integration = await this.prisma.issuerIntegration.findUnique({
      where: { id: input.integrationId },
    });
    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    const update: Prisma.IssuerIntegrationUpdateInput = {
      onboardingReviewedAt: new Date(),
      onboardingReviewedByAuthUserId: reviewerId,
      onboardingReviewNotes: input.notes?.trim() || null,
      status: input.approve ? IntegrationStatus.ENABLED : IntegrationStatus.SUSPENDED,
    };

    if (input.approve && input.aliaddoApiKey?.trim()) {
      const encrypted = this.secrets.encrypt(input.aliaddoApiKey.trim());
      update.aliaddoApiKeyEnc = encrypted.enc;
      update.aliaddoApiKeyIv = encrypted.iv;
      update.aliaddoApiKeyTag = encrypted.tag;
      update.apiKeyHint = createApiKeyHint(input.aliaddoApiKey);
    }

    const updated = await this.prisma.issuerIntegration.update({
      where: { id: integration.id },
      data: update,
      select: integrationSafeSelect,
    });

    if (input.approve && updated.status === IntegrationStatus.ENABLED) {
      const data = (updated.onboardingData ?? {}) as Record<string, unknown>;
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (email) {
        await this.rabbitmq.publishEvent({
          exchange: 'invoicing.events',
          routingKey: 'invoicing.integration.enabled',
          type: 'INVOICING_INTEGRATION_ENABLED',
          producer: 'invoicing-service',
          data: {
            integrationId: updated.id,
            issuerType: updated.issuerType,
            issuerId: updated.issuerId,
            legalName: typeof data.legalName === 'string' ? data.legalName : null,
            email,
          },
        });
      }
    }

    return updated;
  }

  async upsertAliaddoApiKey(
    role: Role | undefined,
    subjectId: string | undefined,
    apiKey: string,
  ) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new BadRequestException('Missing apiKey');
    }
    const encrypted = this.secrets.encrypt(trimmed);
    const hint = createApiKeyHint(trimmed);
    const data: Prisma.IssuerIntegrationUncheckedCreateInput = {
      issuerType: issuer.issuerType,
      issuerId: issuer.issuerId,
      apiKeyHint: hint,
      aliaddoApiKeyEnc: encrypted.enc,
      aliaddoApiKeyIv: encrypted.iv,
      aliaddoApiKeyTag: encrypted.tag,
      status: 'PENDING_DIAN',
    };
    return this.prisma.issuerIntegration.upsert({
      where: { issuerType_issuerId: issuer },
      create: data,
      update: {
        apiKeyHint: data.apiKeyHint,
        aliaddoApiKeyEnc: data.aliaddoApiKeyEnc,
        aliaddoApiKeyIv: data.aliaddoApiKeyIv,
        aliaddoApiKeyTag: data.aliaddoApiKeyTag,
        status: data.status,
      },
      select: integrationSafeSelect,
    });
  }

  async getAliaddoApiKey(role: Role | undefined, subjectId: string | undefined) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const integration = await this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: issuer },
      select: {
        aliaddoApiKeyEnc: true,
        aliaddoApiKeyIv: true,
        aliaddoApiKeyTag: true,
      },
    });
    if (
      !integration?.aliaddoApiKeyEnc ||
      !integration.aliaddoApiKeyIv ||
      !integration.aliaddoApiKeyTag
    ) {
      return null;
    }
    return this.secrets.decrypt({
      enc: integration.aliaddoApiKeyEnc,
      iv: integration.aliaddoApiKeyIv,
      tag: integration.aliaddoApiKeyTag,
    });
  }
}

const integrationSafeSelect = {
  id: true,
  issuerType: true,
  issuerId: true,
  provider: true,
  status: true,
  dianTestSetId: true,
  apiKeyHint: true,
  onboardingData: true,
  onboardingSubmittedAt: true,
  onboardingDraftUpdatedAt: true,
  onboardingReviewedAt: true,
  onboardingReviewedByAuthUserId: true,
  onboardingReviewNotes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IssuerIntegrationSelect;

function createApiKeyHint(apiKey: string) {
  const normalized = apiKey.trim();
  const tail = normalized.slice(-6);
  return normalized.length > 6 ? `…${tail}` : tail;
}

function assertAdmin(role: Role | undefined) {
  if (role === 'ADMIN' || role === 'SYSTEM') return;
  throw new ForbiddenException('Admin role required');
}

function needsReviewForOnboardingChange(
  previous: unknown,
  next: SubmitInvoicingOnboardingDto,
): boolean {
  // If no previous onboarding data, always review.
  if (!previous || typeof previous !== 'object') return true;
  const prev = previous as Record<string, unknown>;

  // Sensitive fields that may affect DIAN/Aliaddo provisioning.
  const keys: Array<keyof SubmitInvoicingOnboardingDto> = [
    'legalName',
    'issuerOperationType',
    'personType',
    'identificationType',
    'identification',
    'digitCheck',
    'countryCode',
    'countryName',
    'postalCode',
    'rutImageId',
    'departmentName',
    'departmentCode',
    'cityName',
    'cityCode2',
    'economicActivity',
    'regimeTypeCode',
    'fiscalResponsibilitiesCodes',
    'vatResponsibilityCode',
    'aliaddoSignatureMode',
    'aliaddoCompanyCreated',
    'aliaddoApiKey',
    'dianEnabled',
    'dianEnvironment',
    'resolutionStatus',
    'resolutionKey',
    'resolutionPrefix',
    'resolutionNumber',
    'technicalKey',
    'rangeInitial',
    'rangeFinal',
    'validFrom',
    'validUntil',
    'resolutionRangeInitial',
    'resolutionRangeFinal',
    'resolutionValidFrom',
    'resolutionValidUntil',
    'lastConsecutiveUsed',
    'nextConsecutive',
    'pdfFormat',
    'typeOfOperation',
    'currency',
    'paymentMeanCode',
    'paymentMeanName',
    'paymentDays',
    'defaultService',
    'defaultServiceTaxConfig',
  ];

  for (const key of keys) {
    const nextValue = (next as unknown as Record<string, unknown>)[key as string];
    const prevValue = prev[key as string];
    if (normalizeComparable(prevValue) !== normalizeComparable(nextValue)) {
      return true;
    }
  }
  return false;
}

function normalizeComparable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim().toLowerCase();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
