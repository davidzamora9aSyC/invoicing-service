import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import type { Role } from '../issuer/issuer.service';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { SendInvoiceDto } from '../documents/dto/send-invoice.dto';
import { SendCreditNoteDto } from '../documents/dto/send-credit-note.dto';
import { SendDebitNoteDto } from '../documents/dto/send-debit-note.dto';

type CsvHeaderType = 'INV' | 'INC' | 'IND';

type ParsedCsvDocument = {
  type: CsvHeaderType;
  header: string[];
  details: string[][];
  headerLine: number;
};

@Injectable()
export class ImportService {
  constructor(private readonly documents: DocumentsService) {}

  private get validateStrict(): boolean {
    return (process.env.INVOICING_IMPORT_VALIDATE_STRICT ?? '').trim().toLowerCase() === 'true';
  }

  async importCsv(input: {
    csvText: string;
    dryRun: boolean;
    role: Role | undefined;
    subjectId: string | undefined;
    authUserId: string | undefined;
  }) {
    const parsed = parseAliaddoCsv(input.csvText);

    const results: Array<
      | { type: CsvHeaderType; status: 'dry_run'; payload: Record<string, unknown> }
      | { type: CsvHeaderType; status: 'sent'; documentId: string }
      | { type: CsvHeaderType; status: 'error'; message: string; headerLine: number }
    > = [];

    for (const doc of parsed) {
      try {
        const payload = buildAliaddoPayload(doc);
        if (this.validateStrict) {
          validatePayloadStrict(doc.type, payload);
        }
        if (input.dryRun) {
          results.push({ type: doc.type, status: 'dry_run', payload });
          continue;
        }

        if (doc.type === 'INV') {
          const created = await this.documents.sendInvoice(input.role, input.subjectId, input.authUserId, payload);
          results.push({ type: doc.type, status: 'sent', documentId: created.id });
          continue;
        }
        if (doc.type === 'INC') {
          const created = await this.documents.sendCreditNote(input.role, input.subjectId, input.authUserId, payload);
          results.push({ type: doc.type, status: 'sent', documentId: created.id });
          continue;
        }
        if (doc.type === 'IND') {
          const created = await this.documents.sendDebitNote(input.role, input.subjectId, input.authUserId, payload);
          results.push({ type: doc.type, status: 'sent', documentId: created.id });
          continue;
        }

        throw new BadRequestException(`Unsupported CSV header type: ${doc.type}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ type: doc.type, status: 'error', message, headerLine: doc.headerLine });
      }
    }

    const summary = results.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.status === 'sent') acc.sent += 1;
        else if (r.status === 'dry_run') acc.dryRun += 1;
        else acc.errors += 1;
        return acc;
      },
      { total: 0, sent: 0, dryRun: 0, errors: 0 },
    );

    return { summary, results };
  }
}

function validatePayloadStrict(type: CsvHeaderType, payload: Record<string, unknown>) {
  if (type === 'INV') {
    validateDtoOrThrow(SendInvoiceDto, payload);
    return;
  }
  if (type === 'INC') {
    validateDtoOrThrow(SendCreditNoteDto, payload);
    return;
  }
  if (type === 'IND') {
    validateDtoOrThrow(SendDebitNoteDto, payload);
    return;
  }
}

function validateDtoOrThrow<T extends object>(dtoClass: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(dtoClass, payload);
  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });
  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'CSV converted payload is not valid for strict DTO',
      errors: formatValidationErrors(errors),
    });
  }
}

function formatValidationErrors(errors: ValidationError[]) {
  const out: Array<{ path: string; constraints?: Record<string, string> }> = [];
  const walk = (err: ValidationError, prefix: string) => {
    const path = prefix ? `${prefix}.${err.property}` : err.property;
    if (err.constraints) out.push({ path, constraints: err.constraints });
    if (err.children && err.children.length) {
      for (const child of err.children) walk(child, path);
    }
  };
  for (const e of errors) walk(e, '');
  return out;
}

function buildAliaddoPayload(doc: ParsedCsvDocument): Record<string, unknown> {
  if (doc.details.length === 0) {
    throw new BadRequestException(`CSV document at line ${doc.headerLine} (${doc.type}) has no DTL lines`);
  }

  if (doc.type === 'INV') {
    return {
      code: at(doc.header, 2),
      format: at(doc.header, 3) || undefined,
      consecutive: at(doc.header, 4),
      date: at(doc.header, 8),
      resolution: { resolutionKey: at(doc.header, 27) },
      customer: { identification: at(doc.header, 39) },
      invoiceDetails: doc.details.map(buildDetail),
    };
  }

  if (doc.type === 'INC') {
    return {
      concept: at(doc.header, 2),
      format: at(doc.header, 3) || undefined,
      consecutive: at(doc.header, 5),
      date: at(doc.header, 9),
      resolution: { resolutionKey: at(doc.header, 29) },
      customer: { identification: at(doc.header, 41) },
      invoiceNoteDetails: doc.details.map(buildDetail),
    };
  }

  if (doc.type === 'IND') {
    return {
      concept: at(doc.header, 2),
      format: at(doc.header, 3) || undefined,
      consecutive: at(doc.header, 5),
      date: at(doc.header, 9),
      resolution: { resolutionKey: at(doc.header, 29) },
      customer: { identification: at(doc.header, 41) },
      invoiceDetails: doc.details.map(buildDetail),
    };
  }

  throw new BadRequestException(`Unsupported CSV header type: ${doc.type}`);
}

function buildDetail(fields: string[]): Record<string, unknown> {
  return {
    itemCode: at(fields, 2),
    itemName: at(fields, 3),
    description: at(fields, 5) || undefined,
    isPresent: parseBooleanOrDefault(at(fields, 8), false),
    unitMeasurementCode: 'NIU',
    price: at(fields, 9),
    quantity: at(fields, 10),
  };
}

function parseBooleanOrDefault(raw: string, fallback: boolean): boolean {
  const norm = raw.trim().toLowerCase();
  if (!norm) return fallback;
  if (norm === '1' || norm === 'true' || norm === 'si' || norm === 'sí') return true;
  if (norm === '0' || norm === 'false' || norm === 'no') return false;
  return fallback;
}

function at(fields: string[], index1: number): string {
  const idx = index1 - 1;
  const value = idx >= 0 && idx < fields.length ? fields[idx] : '';
  return value.trim();
}

function parseAliaddoCsv(csvText: string): ParsedCsvDocument[] {
  const text = csvText.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);

  const docs: ParsedCsvDocument[] = [];
  let current: ParsedCsvDocument | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const fields = splitSemicolonCsvLine(line);
    if (fields.length === 0) continue;

    const recordType = (fields[0] ?? '').trim().toUpperCase();
    if (!recordType) continue;

    // Ignore indicative/description lines (the docs recommend removing these).
    if (recordType === 'TIPO REGISTRO' || recordType === 'CAMPO' || recordType === 'NÚMERO DE COLUMNA Y NOMBRE DEL CAMPO') {
      continue;
    }

    if (recordType === 'INV' || recordType === 'INC' || recordType === 'IND') {
      current = { type: recordType, header: fields, details: [], headerLine: lineNumber };
      docs.push(current);
      continue;
    }

    if (recordType === 'DTL') {
      if (!current) {
        continue;
      }
      current.details.push(fields);
      continue;
    }
  }

  return docs;
}

function splitSemicolonCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = i + 1 < line.length ? line[i + 1] : '';
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ';' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}
