import { BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { AliaddoMode, DocumentFileType, DocumentKind, DocumentStatus, IntegrationStatus, Prisma } from '@prisma/client';
import { AliaddoService } from '../aliaddo/aliaddo.service';
import { FacilFacturaService } from '../facil-factura/facil-factura.service';
import { IssuerService, Role } from '../issuer/issuer.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { createHash } from 'crypto';
import { IntegrationService } from '../integration/integration.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly issuerService: IssuerService,
    private readonly aliaddo: AliaddoService,
    private readonly facilFactura: FacilFacturaService,
    private readonly s3: S3Service,
    private readonly integrationService: IntegrationService,
  ) {}

  private get bucket(): string | undefined {
    const bucket = process.env.S3_BUCKET_PRIVATE?.trim();
    return bucket || undefined;
  }

  private async resolveIntegration(role: Role | undefined, subjectId: string | undefined) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const integration = await this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: issuer },
    });
    return { issuer, integration };
  }

  private assertModeAllowed(kind: DocumentKind, mode: AliaddoMode) {
    if (mode !== AliaddoMode.HABILITATION) return;
    if (kind === DocumentKind.INVOICE || kind === DocumentKind.CREDIT_NOTE || kind === DocumentKind.DEBIT_NOTE) return;
    throw new BadRequestException('Habilitation mode not supported for this document kind');
  }

  private async assertIntegrationForMode(kind: DocumentKind, mode: AliaddoMode, role: Role | undefined, subjectId: string | undefined) {
    const { integration } = await this.resolveIntegration(role, subjectId);
    this.assertIntegrationForModeFromIntegration(kind, mode, integration);
    return { integration };
  }

  private assertIntegrationForModeFromIntegration(
    kind: DocumentKind,
    mode: AliaddoMode,
    integration: { status: IntegrationStatus; dianTestSetId: string | null } | null,
  ) {
    if (mode === AliaddoMode.TEST) return;

    if (!integration) {
      throw new BadRequestException('Integration not configured');
    }

    if (mode === AliaddoMode.PRODUCTION) {
      if (integration.status !== IntegrationStatus.ENABLED) {
        throw new ForbiddenException(`Integration status not enabled: ${integration.status}`);
      }
      return;
    }

    // HABILITATION
    this.assertModeAllowed(kind, mode);
    if (!integration.dianTestSetId?.trim()) {
      throw new BadRequestException('Missing dianTestSetId (configure via integration endpoint)');
    }
  }

  private buildAliaddoPath(kind: DocumentKind, mode: AliaddoMode, dianTestSetId?: string) {
    if (kind === DocumentKind.INVOICE) {
      if (mode === AliaddoMode.PRODUCTION) return '/invoice';
      if (mode === AliaddoMode.HABILITATION) return `/invoice/habilitation/${encodeURIComponent(dianTestSetId!)}`;
      return '/invoice/test';
    }
    if (kind === DocumentKind.CREDIT_NOTE) {
      if (mode === AliaddoMode.PRODUCTION) return '/notes-cr';
      if (mode === AliaddoMode.HABILITATION) return `/notes-cr/habilitation/${encodeURIComponent(dianTestSetId!)}`;
      return '/notes-cr/test';
    }
    if (kind === DocumentKind.DEBIT_NOTE) {
      if (mode === AliaddoMode.PRODUCTION) return '/notes-db';
      if (mode === AliaddoMode.HABILITATION) return `/notes-db/habilitation/${encodeURIComponent(dianTestSetId!)}`;
      return '/notes-db/test';
    }
    if (kind === DocumentKind.SUPPORT_DOCUMENT) {
      if (mode === AliaddoMode.PRODUCTION) return '/support';
      return '/support/test';
    }
    if (kind === DocumentKind.SUPPORT_ADJUSTMENT) {
      if (mode === AliaddoMode.PRODUCTION) return '/support/adjustments';
      return '/support/adjustments/test';
    }
    throw new BadRequestException('Unsupported document kind');
  }

  private parseResponseSummary(responseBody: unknown) {
    if (!responseBody || typeof responseBody !== 'object') return {};
    const body = responseBody as Record<string, unknown>;
    const dianStateReasonRaw = (body as Record<string, unknown>).dianStateReason;
    const dianStateReason =
      dianStateReasonRaw === undefined
        ? undefined
        : dianStateReasonRaw === null
          ? Prisma.JsonNull
          : (dianStateReasonRaw as Prisma.InputJsonValue);
    return {
      aliaddoId: asString(body.id),
      cufe: asString(body.cufe),
      cuds: asString(body.cuds),
      dianDeliveryStatus: asString(body.dianDeliveryStatus),
      dianState: asString(body.dianState),
      dianStateReason,
      urlPdf: asString(body.urlPdf) ?? asString(body.UrlPdfEncoded),
      urlXmlDocument: asString(body.urlXmlDocument) ?? asString(body.UrlXmlEncoded),
      urlXmlDocumentZip: asString(body.urlXmlDocumentZip),
      urlXmlApplicationResponse: asString(body.urlXmlApplicationResponse),
      urlXmlAttachedDocument: asString(body.urlXmlAttachedDocument),
    };
  }

  private async storeFile(
    documentId: string,
    attemptNumber: number,
    type: DocumentFileType,
    sourceUrl: string,
    contentTypeHint?: string,
  ) {
    const bucket = this.bucket;
    if (!bucket) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(sourceUrl, { signal: controller.signal });
      if (!res.ok) {
        throw new HttpException(
          `Failed to download file (${type}) from Aliaddo url (status ${res.status})`,
          502,
        );
      }
      const contentType = res.headers.get('content-type') ?? contentTypeHint ?? undefined;
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const sha256 = createHash('sha256').update(bytes).digest('hex');

      const ext = fileTypeExtension(type);
      const objectKey = `invoicing/${documentId}/attempts/${attemptNumber}/${type.toLowerCase()}${ext ? `.${ext}` : ''}`;

      await this.s3.putObject({
        bucket,
        objectKey,
        body: bytes,
        contentType,
        metadata: { sha256 },
      });

      await this.prisma.invoicingDocumentFile.create({
        data: {
          documentId,
          type,
          attemptNumber,
          sourceUrl,
          bucket,
          objectKey,
          contentType,
          sizeBytes: bytes.byteLength,
          sha256,
        },
      });

      return { bucket, objectKey };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendDocument(
    kind: DocumentKind,
    role: Role | undefined,
    subjectId: string | undefined,
    authUserId: string | undefined,
    payload: Record<string, unknown>,
  ) {
    const mode = this.aliaddo.mode;
    this.assertModeAllowed(kind, mode);

    const { issuer, integration } = await this.resolveIntegration(role, subjectId);
    await this.assertIntegrationForMode(kind, mode, role, subjectId);

    const document = await this.prisma.invoicingDocument.create({
      data: {
        issuerType: issuer.issuerType,
        issuerId: issuer.issuerId,
        authUserId: authUserId?.trim() || null,
        kind,
        mode,
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        attemptCount: 0,
        status: DocumentStatus.CREATED,
      },
    });

    const attemptNumber = 1;
    const path = this.buildAliaddoPath(kind, mode, integration?.dianTestSetId?.trim());

    const startedAt = Date.now();
    try {
      const issuerApiKey =
        (await this.integrationService.getAliaddoApiKey(role, subjectId)) ??
        process.env.ALIADDO_X_API_KEY;

      const responseBody = issuerApiKey?.trim()
        ? await this.aliaddo.postWithApiKey(path, payload, issuerApiKey)
        : await this.aliaddo.post(path, payload);
      const durationMs = Date.now() - startedAt;

      const summary = this.parseResponseSummary(responseBody);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: document.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || null,
          requestPayload: payload as unknown as Prisma.InputJsonValue,
          responseStatusCode: 200,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          durationMs,
        },
      });

      const updated = await this.prisma.invoicingDocument.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.SENT,
          attemptCount: 1,
          ...summary,
        },
      });

      // Best-effort: cache files in S3 (if configured)
      const urlPdf = updated.urlPdf;
      const urlXml = updated.urlXmlDocument;
      const urlZip = updated.urlXmlDocumentZip;
      const urlAppResponse = updated.urlXmlApplicationResponse;
      const urlAttached = updated.urlXmlAttachedDocument;

      if (urlPdf) await this.storeFile(updated.id, attemptNumber, DocumentFileType.PDF, urlPdf, 'application/pdf');
      if (urlXml) await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML, urlXml, 'application/xml');
      if (urlZip) await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML_ZIP, urlZip, 'application/zip');
      if (urlAppResponse)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.APPLICATION_RESPONSE, urlAppResponse, 'application/xml');
      if (urlAttached)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.ATTACHED_DOCUMENT, urlAttached, 'application/xml');

      return updated;
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAt;
      const { statusCode, responseBody, message } = normalizeError(err);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: document.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || null,
          requestPayload: payload as unknown as Prisma.InputJsonValue,
          responseStatusCode: statusCode,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          errorMessage: message,
          durationMs,
        },
      });

      await this.prisma.invoicingDocument.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          attemptCount: 1,
        },
      });
      throw err;
    }
  }

  async sendInvoice(role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined, payload: Record<string, unknown>) {
    return this.sendDocument(DocumentKind.INVOICE, role, subjectId, authUserId, payload);
  }

  async sendCreditNote(role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined, payload: Record<string, unknown>) {
    return this.sendDocument(DocumentKind.CREDIT_NOTE, role, subjectId, authUserId, payload);
  }

  async sendDebitNote(role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined, payload: Record<string, unknown>) {
    return this.sendDocument(DocumentKind.DEBIT_NOTE, role, subjectId, authUserId, payload);
  }

  async sendSupportDocument(role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined, payload: Record<string, unknown>) {
    return this.sendDocument(DocumentKind.SUPPORT_DOCUMENT, role, subjectId, authUserId, payload);
  }

  async sendSupportAdjustmentNote(role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined, payload: Record<string, unknown>) {
    return this.sendDocument(DocumentKind.SUPPORT_ADJUSTMENT, role, subjectId, authUserId, payload);
  }

  async list(role: Role | undefined, subjectId: string | undefined, limitRaw?: string) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const limit = limitRaw ? Number(limitRaw) : 20;
    const take = Number.isFinite(limit) && limit > 0 && limit <= 100 ? Math.floor(limit) : 20;
    return this.prisma.invoicingDocument.findMany({
      where: { issuerType: issuer.issuerType, issuerId: issuer.issuerId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        kind: true,
        mode: true,
        status: true,
        aliaddoId: true,
        cufe: true,
        cuds: true,
        dianDeliveryStatus: true,
        dianState: true,
        attemptCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getDocument(documentId: string, role: Role | undefined, subjectId: string | undefined) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const doc = await this.prisma.invoicingDocument.findUnique({
      where: { id: documentId },
      include: { attempts: { orderBy: { number: 'asc' } }, files: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.issuerType !== issuer.issuerType || doc.issuerId !== issuer.issuerId) {
      throw new ForbiddenException('Not allowed');
    }
    return doc;
  }

  async retry(documentId: string, role: Role | undefined, subjectId: string | undefined, authUserId: string | undefined) {
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    const doc = await this.prisma.invoicingDocument.findUnique({
      where: { id: documentId },
      include: { attempts: { orderBy: { number: 'asc' } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.issuerType !== issuer.issuerType || doc.issuerId !== issuer.issuerId) {
      throw new ForbiddenException('Not allowed');
    }

    const dianDeliveryStatus = (doc.dianDeliveryStatus ?? '').toLowerCase();
    if (dianDeliveryStatus && dianDeliveryStatus !== 'new' && dianDeliveryStatus !== 'error') {
      throw new BadRequestException('Retry not allowed for current dianDeliveryStatus');
    }

    const mode = this.aliaddo.mode;
    this.assertModeAllowed(doc.kind, mode);

    const attemptNumber = doc.attemptCount + 1;
    const { integration } = await this.assertIntegrationForMode(doc.kind, mode, role, subjectId);
    const path = this.buildAliaddoPath(doc.kind, mode, integration?.dianTestSetId?.trim());

    const startedAt = Date.now();
    try {
      const responseBody = await this.aliaddo.post(path, doc.requestPayload);
      const durationMs = Date.now() - startedAt;

      const summary = this.parseResponseSummary(responseBody);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: doc.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || doc.authUserId,
          requestPayload: doc.requestPayload as unknown as Prisma.InputJsonValue,
          responseStatusCode: 200,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          durationMs,
        },
      });

      const updated = await this.prisma.invoicingDocument.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.SENT,
          attemptCount: attemptNumber,
          ...summary,
        },
      });

      if (updated.urlPdf) await this.storeFile(updated.id, attemptNumber, DocumentFileType.PDF, updated.urlPdf, 'application/pdf');
      if (updated.urlXmlDocument)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML, updated.urlXmlDocument, 'application/xml');
      if (updated.urlXmlDocumentZip)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML_ZIP, updated.urlXmlDocumentZip, 'application/zip');
      if (updated.urlXmlApplicationResponse)
        await this.storeFile(
          updated.id,
          attemptNumber,
          DocumentFileType.APPLICATION_RESPONSE,
          updated.urlXmlApplicationResponse,
          'application/xml',
        );
      if (updated.urlXmlAttachedDocument)
        await this.storeFile(
          updated.id,
          attemptNumber,
          DocumentFileType.ATTACHED_DOCUMENT,
          updated.urlXmlAttachedDocument,
          'application/xml',
        );

      return updated;
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAt;
      const { statusCode, responseBody, message } = normalizeError(err);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: doc.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || doc.authUserId,
          requestPayload: doc.requestPayload as unknown as Prisma.InputJsonValue,
          responseStatusCode: statusCode,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          errorMessage: message,
          durationMs,
        },
      });

      await this.prisma.invoicingDocument.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.FAILED, attemptCount: attemptNumber },
      });
      throw err;
    }
  }

  async retryInternal(documentId: string, authUserId?: string | null) {
    const doc = await this.prisma.invoicingDocument.findUnique({
      where: { id: documentId },
      include: { attempts: { orderBy: { number: 'asc' } } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const dianDeliveryStatus = (doc.dianDeliveryStatus ?? '').toLowerCase();
    if (dianDeliveryStatus && dianDeliveryStatus !== 'new' && dianDeliveryStatus !== 'error') {
      throw new BadRequestException('Retry not allowed for current dianDeliveryStatus');
    }

    const mode = this.aliaddo.mode;
    this.assertModeAllowed(doc.kind, mode);

    const integration = await this.prisma.issuerIntegration.findUnique({
      where: { issuerType_issuerId: { issuerType: doc.issuerType, issuerId: doc.issuerId } },
      select: { status: true, dianTestSetId: true },
    });
    this.assertIntegrationForModeFromIntegration(doc.kind, mode, integration);

    const attemptNumber = doc.attemptCount + 1;
    const path = this.buildAliaddoPath(doc.kind, mode, integration?.dianTestSetId?.trim() || undefined);

    const startedAt = Date.now();
    try {
      const responseBody = await this.aliaddo.post(path, doc.requestPayload);
      const durationMs = Date.now() - startedAt;

      const summary = this.parseResponseSummary(responseBody);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: doc.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || doc.authUserId,
          requestPayload: doc.requestPayload as unknown as Prisma.InputJsonValue,
          responseStatusCode: 200,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          durationMs,
        },
      });

      const updated = await this.prisma.invoicingDocument.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.SENT,
          attemptCount: attemptNumber,
          ...summary,
        },
      });

      if (updated.urlPdf) await this.storeFile(updated.id, attemptNumber, DocumentFileType.PDF, updated.urlPdf, 'application/pdf');
      if (updated.urlXmlDocument)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML, updated.urlXmlDocument, 'application/xml');
      if (updated.urlXmlDocumentZip)
        await this.storeFile(updated.id, attemptNumber, DocumentFileType.XML_ZIP, updated.urlXmlDocumentZip, 'application/zip');
      if (updated.urlXmlApplicationResponse)
        await this.storeFile(
          updated.id,
          attemptNumber,
          DocumentFileType.APPLICATION_RESPONSE,
          updated.urlXmlApplicationResponse,
          'application/xml',
        );
      if (updated.urlXmlAttachedDocument)
        await this.storeFile(
          updated.id,
          attemptNumber,
          DocumentFileType.ATTACHED_DOCUMENT,
          updated.urlXmlAttachedDocument,
          'application/xml',
        );

      return updated;
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAt;
      const { statusCode, responseBody, message } = normalizeError(err);

      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: doc.id,
          number: attemptNumber,
          mode,
          authUserId: authUserId?.trim() || doc.authUserId,
          requestPayload: doc.requestPayload as unknown as Prisma.InputJsonValue,
          responseStatusCode: statusCode,
          responseBody: responseBody as unknown as Prisma.InputJsonValue,
          errorMessage: message,
          durationMs,
        },
      });

      await this.prisma.invoicingDocument.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.FAILED, attemptCount: attemptNumber },
      });
      throw err;
    }
  }

  async getFileUrl(documentId: string, typeRaw: string, role: Role | undefined, subjectId: string | undefined) {
    const type = parseFileType(typeRaw);
    const doc = await this.prisma.invoicingDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    if (doc.issuerType !== issuer.issuerType || doc.issuerId !== issuer.issuerId) {
      throw new ForbiddenException('Not allowed');
    }
    const file = await this.prisma.invoicingDocumentFile.findFirst({
      where: { documentId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (file) {
      const url = await this.s3.createViewUrl({ bucket: file.bucket, objectKey: file.objectKey, expiresIn: 300 });
      return { url };
    }

    const sourceUrl = fileTypeSourceUrl(doc, type);
    if (!sourceUrl) throw new NotFoundException('File not found');

    const attemptNumber = doc.attemptCount || 0;
    const stored = await this.storeFile(doc.id, attemptNumber, type, sourceUrl);
    if (!stored) {
      throw new BadRequestException('Storage not configured (missing S3_BUCKET_PRIVATE)');
    }
    const url = await this.s3.createViewUrl({ bucket: stored.bucket, objectKey: stored.objectKey, expiresIn: 300 });
    return { url, cached: true };
  }

  async cacheFiles(documentId: string, role: Role | undefined, subjectId: string | undefined) {
    const doc = await this.prisma.invoicingDocument.findUnique({
      where: { id: documentId },
      include: { files: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    const issuer = this.issuerService.resolveIssuer(role, subjectId);
    if (doc.issuerType !== issuer.issuerType || doc.issuerId !== issuer.issuerId) {
      throw new ForbiddenException('Not allowed');
    }

    const existing = new Set(doc.files.map((f) => `${f.type}`));
    const attemptNumber = doc.attemptCount || 0;

    const results: Array<{ type: DocumentFileType; status: 'cached' | 'skipped' | 'missing_url' | 'error'; message?: string }> = [];
    const types: DocumentFileType[] = [
      DocumentFileType.PDF,
      DocumentFileType.XML,
      DocumentFileType.XML_ZIP,
      DocumentFileType.APPLICATION_RESPONSE,
      DocumentFileType.ATTACHED_DOCUMENT,
    ];

    for (const type of types) {
      if (existing.has(`${type}`)) {
        results.push({ type, status: 'skipped' });
        continue;
      }
      const sourceUrl = fileTypeSourceUrl(doc, type);
      if (!sourceUrl) {
        results.push({ type, status: 'missing_url' });
        continue;
      }
      try {
        const stored = await this.storeFile(doc.id, attemptNumber, type, sourceUrl);
        if (!stored) {
          results.push({ type, status: 'error', message: 'Storage not configured (missing S3_BUCKET_PRIVATE)' });
          continue;
        }
        results.push({ type, status: 'cached' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ type, status: 'error', message });
      }
    }

    return { documentId: doc.id, results };
  }

  async cacheFilesInternal(documentId: string) {
    const doc = await this.prisma.invoicingDocument.findUnique({
      where: { id: documentId },
      include: { files: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const existing = new Set(doc.files.map((f) => `${f.type}`));
    const attemptNumber = doc.attemptCount || 0;

    const results: Array<{ type: DocumentFileType; status: 'cached' | 'skipped' | 'missing_url' | 'error'; message?: string }> = [];
    const types: DocumentFileType[] = [
      DocumentFileType.PDF,
      DocumentFileType.XML,
      DocumentFileType.XML_ZIP,
      DocumentFileType.APPLICATION_RESPONSE,
      DocumentFileType.ATTACHED_DOCUMENT,
    ];

    for (const type of types) {
      if (existing.has(`${type}`)) {
        results.push({ type, status: 'skipped' });
        continue;
      }
      const sourceUrl = fileTypeSourceUrl(doc, type);
      if (!sourceUrl) {
        results.push({ type, status: 'missing_url' });
        continue;
      }
      try {
        const stored = await this.storeFile(doc.id, attemptNumber, type, sourceUrl);
        if (!stored) {
          results.push({ type, status: 'error', message: 'Storage not configured (missing S3_BUCKET_PRIVATE)' });
          continue;
        }
        results.push({ type, status: 'cached' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ type, status: 'error', message });
      }
    }

    return { documentId: doc.id, results };
  }

  async listFacilFacturaResolutions(role: Role | undefined, subjectId: string | undefined) {
    const credentials = await this.integrationService.getFacilFacturaCredentials(role, subjectId);
    if (!credentials) {
      throw new BadRequestException('Configura la API Key y el API Secret de Facil Factura en Integración.');
    }
    const body = await this.facilFactura.getResolutions(credentials);
    return { options: mapFacilFacturaResolutions(body) };
  }

  async sendFacilFacturaInvoice(
    role: Role | undefined,
    subjectId: string | undefined,
    authUserId: string | undefined,
    payload: Record<string, unknown>,
    health = false,
  ) {
    const credentials = await this.integrationService.getFacilFacturaCredentials(role, subjectId);
    if (!credentials) {
      throw new BadRequestException('Configura la API Key y el API Secret de Facil Factura en Integración.');
    }
    const { issuer } = await this.resolveIntegration(role, subjectId);
    const document = await this.prisma.invoicingDocument.create({
      data: {
        issuerType: issuer.issuerType,
        issuerId: issuer.issuerId,
        authUserId: authUserId?.trim() || null,
        kind: DocumentKind.INVOICE,
        mode: AliaddoMode.TEST,
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        attemptCount: 0,
        status: DocumentStatus.CREATED,
        dianDeliveryStatus: 'FACIL_FACTURA',
      },
    });

    const startedAt = Date.now();
    try {
      const responseBody = health
        ? await this.facilFactura.postHealthInvoice(credentials, payload)
        : await this.facilFactura.postInvoice(credentials, payload);
      const summary = this.parseFacilResponse(responseBody);
      const durationMs = Date.now() - startedAt;
      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: document.id,
          number: 1,
          mode: AliaddoMode.TEST,
          authUserId: authUserId?.trim() || null,
          requestPayload: payload as unknown as Prisma.InputJsonValue,
          responseStatusCode: 200,
          responseBody: (responseBody ?? {}) as Prisma.InputJsonValue,
          durationMs,
        },
      });
      return this.prisma.invoicingDocument.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.SENT,
          attemptCount: 1,
          aliaddoId: summary.aliaddoId ?? null,
          cufe: summary.cufe ?? null,
          dianState: summary.dianState ?? null,
          dianDeliveryStatus: 'FACIL_FACTURA',
        },
      });
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const message = err instanceof HttpException ? messageFromHttpException(err) : 'No se pudo emitir en Facil Factura';
      const statusCode = err instanceof HttpException ? err.getStatus() : 502;
      await this.prisma.invoicingDocumentAttempt.create({
        data: {
          documentId: document.id,
          number: 1,
          mode: AliaddoMode.TEST,
          authUserId: authUserId?.trim() || null,
          requestPayload: payload as unknown as Prisma.InputJsonValue,
          responseStatusCode: statusCode,
          errorMessage: message,
          durationMs,
        },
      });
      await this.prisma.invoicingDocument.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          attemptCount: 1,
          dianDeliveryStatus: 'FACIL_FACTURA',
          dianStateReason: { message } as Prisma.InputJsonValue,
        },
      });
      throw err;
    }
  }

  async downloadFacilFacturaPdf(documentId: string, role: Role | undefined, subjectId: string | undefined) {
    const doc = await this.getDocument(documentId, role, subjectId);
    if (doc.dianDeliveryStatus !== 'FACIL_FACTURA' || !doc.aliaddoId) {
      throw new BadRequestException('Este documento no tiene PDF de Facil Factura.');
    }
    const credentials = await this.integrationService.getFacilFacturaCredentials(role, subjectId);
    if (!credentials) {
      throw new BadRequestException('Configura la API Key y el API Secret de Facil Factura en Integración.');
    }
    return this.facilFactura.getPdf(credentials, doc.aliaddoId);
  }

  private parseFacilResponse(responseBody: unknown) {
    const body = responseBody && typeof responseBody === 'object' ? (responseBody as Record<string, unknown>) : {};
    const nested = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};
    const source = asString(body.id) ? body : nested;
    return {
      aliaddoId: asString(source.id) ?? asString(body.id),
      cufe: asString(source.cufe) ?? asString(nested.cufe),
      dianState: asString(source.status) ?? asString(source.state) ?? asString(body.status) ?? asString(nested.status),
    };
  }
}

function messageFromHttpException(err: HttpException) {
  const response = err.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join('\n');
  }
  return err.message;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function fileTypeExtension(type: DocumentFileType): string | null {
  if (type === DocumentFileType.PDF) return 'pdf';
  if (type === DocumentFileType.XML) return 'xml';
  if (type === DocumentFileType.XML_ZIP) return 'zip';
  if (type === DocumentFileType.APPLICATION_RESPONSE) return 'xml';
  if (type === DocumentFileType.ATTACHED_DOCUMENT) return 'xml';
  return null;
}

function parseFileType(raw: string): DocumentFileType {
  const norm = raw.trim().toUpperCase();
  if (norm === 'PDF') return DocumentFileType.PDF;
  if (norm === 'XML') return DocumentFileType.XML;
  if (norm === 'XML_ZIP' || norm === 'ZIP') return DocumentFileType.XML_ZIP;
  if (norm === 'APPLICATION_RESPONSE' || norm === 'APP_RESPONSE') return DocumentFileType.APPLICATION_RESPONSE;
  if (norm === 'ATTACHED_DOCUMENT' || norm === 'ATTACHED') return DocumentFileType.ATTACHED_DOCUMENT;
  throw new BadRequestException('Invalid file type');
}

function fileTypeSourceUrl(
  doc: { urlPdf: string | null; urlXmlDocument: string | null; urlXmlDocumentZip: string | null; urlXmlApplicationResponse: string | null; urlXmlAttachedDocument: string | null },
  type: DocumentFileType,
): string | null {
  if (type === DocumentFileType.PDF) return doc.urlPdf;
  if (type === DocumentFileType.XML) return doc.urlXmlDocument;
  if (type === DocumentFileType.XML_ZIP) return doc.urlXmlDocumentZip;
  if (type === DocumentFileType.APPLICATION_RESPONSE) return doc.urlXmlApplicationResponse;
  if (type === DocumentFileType.ATTACHED_DOCUMENT) return doc.urlXmlAttachedDocument;
  return null;
}

function mapFacilFacturaResolutions(body: unknown) {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const rows = Array.isArray(record.resolutions) ? record.resolutions : [];
  return rows
    .map((row, index) => mapFacilFacturaResolution(row, index))
    .filter((row): row is FacilFacturaResolutionOption => Boolean(row));
}

function mapFacilFacturaResolution(row: unknown, index: number): FacilFacturaResolutionOption | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const prefix = readText(record, ['prefix', 'resolutionPrefix', 'Prefix']);
  const resolutionNumber = readText(record, ['resolutionNumber', 'resolution_number', 'number', 'resolution']);
  if (!prefix && !resolutionNumber) return null;
  if (isInactiveResolution(record)) return null;
  const rangeFrom = readNumber(record, ['rangeFrom', 'from', 'initial', 'min', 'fromNumber', 'rangeInitial']);
  const rangeTo = readNumber(record, ['rangeTo', 'to', 'final', 'max', 'toNumber', 'rangeFinal']);
  const nextNumber = readNumber(record, ['nextNumber', 'next', 'currentNumber']);
  return {
    id: `${prefix || 'sin-prefijo'}-${resolutionNumber || index}`,
    prefix: prefix || '',
    resolutionNumber: resolutionNumber || '',
    nextNumber,
    rangeFrom,
    rangeTo,
    validFrom: readText(record, ['validFrom', 'fromDate', 'startDate', 'resolutionValidFrom']),
    validUntil: readText(record, ['validUntil', 'toDate', 'endDate', 'resolutionValidUntil']),
  };
}

function isInactiveResolution(record: Record<string, unknown>) {
  if (record.active === false || record.isActive === false) return true;
  const status = readText(record, ['status', 'state'])?.toLowerCase();
  return status === 'inactive' || status === 'expired' || status === 'exhausted' || status === 'vencida' || status === 'agotada';
}

function readText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

type FacilFacturaResolutionOption = {
  id: string;
  prefix: string;
  resolutionNumber: string;
  nextNumber: number | null;
  rangeFrom: number | null;
  rangeTo: number | null;
  validFrom: string | null;
  validUntil: string | null;
};

function normalizeError(err: unknown): { statusCode: number | null; responseBody: unknown | null; message: string } {
  if (err instanceof HttpException) {
    const statusCode = err.getStatus();
    const responseBody = err.getResponse();
    const message = err.message || 'HttpException';
    return { statusCode, responseBody, message };
  }
  const anyErr = err as { message?: unknown };
  const message = typeof anyErr?.message === 'string' ? anyErr.message : 'Unknown error';
  return { statusCode: null, responseBody: null, message };
}
