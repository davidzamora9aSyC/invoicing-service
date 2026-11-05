import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FacilFacturaCredentials = {
  apiKey: string;
  apiSecret: string;
};

@Injectable()
export class FacilFacturaService {
  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return (this.config.get<string>('FACIL_FACTURA_BASE_URL') ?? 'https://api.facil-factura.pro').replace(/\/$/, '');
  }

  private get timeoutMs(): number {
    const raw = this.config.get<string>('FACIL_FACTURA_TIMEOUT_MS')?.trim();
    const parsed = raw ? Number(raw) : 20000;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
  }

  getResolutions(credentials: FacilFacturaCredentials) {
    return this.requestJson('GET', '/api/co/dian/resolutions', credentials);
  }

  postInvoice(credentials: FacilFacturaCredentials, payload: unknown) {
    return this.requestJson('POST', '/api/co/dian/invoices', credentials, payload);
  }

  postHealthInvoice(credentials: FacilFacturaCredentials, payload: unknown) {
    return this.requestJson('POST', '/api/co/dian/health-invoices', credentials, payload);
  }

  getDocument(credentials: FacilFacturaCredentials, providerDocumentId: string) {
    return this.requestJson('GET', `/api/co/dian/documents/${encodeURIComponent(providerDocumentId)}`, credentials);
  }

  async getPdf(credentials: FacilFacturaCredentials, providerDocumentId: string) {
    const url = `${this.baseUrl}/api/co/dian/documents/${encodeURIComponent(providerDocumentId)}/pdf`;
    const res = await this.fetchWithTimeout(url, credentials);
    if (!res.ok) {
      const raw = await res.text();
      throw providerException(res.status, raw);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    return bytes;
  }

  private async requestJson(
    method: 'GET' | 'POST',
    path: string,
    credentials: FacilFacturaCredentials,
    payload?: unknown,
  ) {
    const res = await this.fetchWithTimeout(`${this.baseUrl}${path}`, credentials, method, payload);
    const raw = await res.text();
    const body = raw ? safeJsonParse(raw) : null;
    if (!res.ok) {
      throw providerException(res.status, raw, body);
    }
    return body;
  }

  private async fetchWithTimeout(
    url: string,
    credentials: FacilFacturaCredentials,
    method: 'GET' | 'POST' = 'GET',
    payload?: unknown,
  ) {
    const apiKey = credentials.apiKey.trim();
    const apiSecret = credentials.apiSecret.trim();
    if (!apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Missing Facil Factura credentials');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, {
        method,
        headers: {
          Accept: method === 'GET' && url.endsWith('/pdf') ? 'application/pdf' : 'application/json',
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          'x-api-key': apiKey,
          'x-api-secret': apiSecret,
        },
        body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      throw new ServiceUnavailableException(aborted ? 'Facil Factura timeout' : 'Facil Factura unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function providerException(status: number, raw: string, parsed?: unknown) {
  const body = parsed === undefined ? safeJsonParse(raw) : parsed;
  const message = providerMessage(body) || `Facil Factura respondió ${status}`;
  return new HttpException({ message, providerStatus: status, provider: body }, status >= 400 && status < 600 ? status : 502);
}

function providerMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return typeof body === 'string' && body.trim() ? body.trim() : null;
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
  if (Array.isArray(record.details) && record.details.length) {
    return record.details.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
  }
  return null;
}
