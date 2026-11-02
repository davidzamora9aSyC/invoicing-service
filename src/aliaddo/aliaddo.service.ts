import { BadGatewayException, BadRequestException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AliaddoMode } from '@prisma/client';

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
}

@Injectable()
export class AliaddoService {
  constructor(private readonly config: ConfigService) {}

  get mode(): AliaddoMode {
    const explicit = this.config.get<string>('ALIADDO_MODE')?.trim().toLowerCase();
    if (explicit) {
      if (explicit === 'test') return AliaddoMode.TEST;
      if (explicit === 'habilitation') return AliaddoMode.HABILITATION;
      if (explicit === 'production' || explicit === 'prod') return AliaddoMode.PRODUCTION;
      throw new BadRequestException('Invalid ALIADDO_MODE (use: test|habilitation|production)');
    }

    const prod = parseBoolean(this.config.get<string>('ALIADDO_PROD'));
    const hab = parseBoolean(this.config.get<string>('ALIADDO_HABILITATION'));
    if (prod && hab) {
      throw new BadRequestException('Conflicting Aliaddo mode: ALIADDO_PROD and ALIADDO_HABILITATION');
    }
    if (prod) return AliaddoMode.PRODUCTION;
    if (hab) return AliaddoMode.HABILITATION;
    return AliaddoMode.TEST;
  }

  private get baseUrl(): string {
    return (
      this.config.get<string>('ALIADDO_BASE_URL') ??
      'https://isv.aliaddo.net/api/v1/public/documents'
    );
  }

  private get apiKey(): string {
    const apiKey = this.config.get<string>('ALIADDO_X_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('Missing ALIADDO_X_API_KEY');
    }
    return apiKey;
  }

  private get timeoutMs(): number {
    const raw = this.config.get<string>('ALIADDO_TIMEOUT_MS')?.trim();
    const parsed = raw ? Number(raw) : 15000;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
  }

  async post(path: string, payload: unknown) {
    return this.requestJson('POST', path, payload);
  }

  async get(path: string) {
    return this.requestJson('GET', path);
  }

  async getWithApiKey(path: string, apiKey: string) {
    return this.requestJson('GET', path, undefined, apiKey);
  }

  async postWithApiKey(path: string, payload: unknown, apiKey: string) {
    return this.requestJson('POST', path, payload, apiKey);
  }

  private async requestJson(
    method: 'GET' | 'POST',
    path: string,
    payload?: unknown,
    apiKeyOverride?: string,
  ) {
    const url = new URL(
      path.replace(/^\/+/, ''),
      this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          'x-api-key': apiKeyOverride?.trim() || this.apiKey,
        },
        body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
        signal: controller.signal,
      });

      const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
      const rawBody = await res.text();
      const body = contentType.includes('application/json') && rawBody ? safeJsonParse(rawBody) : rawBody;

      if (!res.ok) {
        if (res.status >= 500) {
          throw new BadGatewayException({
            error: 'ALIADDO_UPSTREAM_ERROR',
            providerStatusCode: res.status,
            response: body,
          });
        }
        throw new HttpException(
          {
            error: 'ALIADDO_ERROR',
            statusCode: res.status,
            response: body,
          },
          res.status,
        );
      }

      return body;
    } catch (err: unknown) {
      const maybeError = err as { name?: string };
      if (maybeError?.name === 'AbortError') {
        throw new ServiceUnavailableException('Aliaddo request timeout');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
