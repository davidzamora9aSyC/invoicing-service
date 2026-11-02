import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DocumentStatus } from '@prisma/client';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  private get opsEnabled(): boolean {
    return (process.env.INVOICING_OPS_ENABLED ?? '').trim().toLowerCase() === 'true';
  }

  private get cacheFilesEnabled(): boolean {
    const raw = (process.env.INVOICING_CACHE_FILES_ENABLED ?? '').trim().toLowerCase();
    if (!raw) return true;
    return raw === 'true';
  }

  private get retryMaxAttempts(): number {
    const raw = Number(process.env.INVOICING_RETRY_MAX_ATTEMPTS ?? '7');
    return Number.isFinite(raw) && raw >= 1 && raw <= 50 ? Math.floor(raw) : 7;
  }

  private get retryBaseDelaySeconds(): number {
    const raw = Number(process.env.INVOICING_RETRY_BASE_DELAY_SECONDS ?? '20');
    return Number.isFinite(raw) && raw >= 1 && raw <= 3600 ? Math.floor(raw) : 20;
  }

  private shouldRetryNow(lastAttemptAt: Date, attemptCount: number): boolean {
    const exponent = Math.max(attemptCount - 1, 0);
    const delaySeconds = this.retryBaseDelaySeconds * Math.pow(2, exponent);
    const delayMs = Math.min(delaySeconds, 6 * 60 * 60) * 1000; // cap 6h
    return Date.now() - lastAttemptAt.getTime() >= delayMs;
  }

  @Cron('*/30 * * * * *')
  async retryFailedDocuments() {
    if (!this.opsEnabled) return;

    const docs = await this.prisma.invoicingDocument.findMany({
      where: {
        status: DocumentStatus.FAILED,
        attemptCount: { lt: this.retryMaxAttempts },
        OR: [
          { dianDeliveryStatus: { in: ['new', 'error'] } },
          { dianDeliveryStatus: null },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      take: 20,
      include: {
        attempts: { orderBy: { number: 'desc' }, take: 1, select: { createdAt: true } },
      },
    });

    for (const doc of docs) {
      const lastAttemptAt = doc.attempts[0]?.createdAt ?? doc.updatedAt;
      if (!this.shouldRetryNow(lastAttemptAt, doc.attemptCount)) continue;
      try {
        await this.documents.retryInternal(doc.id, doc.authUserId);
      } catch {
        // append-only attempts already logged by DocumentsService
      }
    }
  }

  @Cron('0 */5 * * * *')
  async cacheMissingFiles() {
    if (!this.opsEnabled) return;
    if (!this.cacheFilesEnabled) return;

    const docs = await this.prisma.invoicingDocument.findMany({
      where: {
        status: DocumentStatus.SENT,
        OR: [
          { urlPdf: { not: null } },
          { urlXmlDocument: { not: null } },
          { urlXmlDocumentZip: { not: null } },
          { urlXmlApplicationResponse: { not: null } },
          { urlXmlAttachedDocument: { not: null } },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });

    for (const doc of docs) {
      try {
        await this.documents.cacheFilesInternal(doc.id);
      } catch {
        // best-effort
      }
    }
  }
}

