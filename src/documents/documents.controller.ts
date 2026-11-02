import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { Role } from '../issuer/issuer.service';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { SendCreditNoteDto } from './dto/send-credit-note.dto';
import { SendDebitNoteDto } from './dto/send-debit-note.dto';
import { SendSupportDocumentDto } from './dto/send-support-document.dto';
import { SendSupportAdjustmentDto } from './dto/send-support-adjustment.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('invoice')
  sendInvoice(
    @Body() payload: SendInvoiceDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.sendInvoice(role as Role | undefined, subjectId, authUserId, payload as unknown as Record<string, unknown>);
  }

  @Post('notes-cr')
  sendCreditNote(
    @Body() payload: SendCreditNoteDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.sendCreditNote(role as Role | undefined, subjectId, authUserId, payload as unknown as Record<string, unknown>);
  }

  @Post('notes-db')
  sendDebitNote(
    @Body() payload: SendDebitNoteDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.sendDebitNote(role as Role | undefined, subjectId, authUserId, payload as unknown as Record<string, unknown>);
  }

  @Post('support')
  sendSupportDocument(
    @Body() payload: SendSupportDocumentDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.sendSupportDocument(role as Role | undefined, subjectId, authUserId, payload as unknown as Record<string, unknown>);
  }

  @Post('support/adjustments')
  sendSupportAdjustmentNote(
    @Body() payload: SendSupportAdjustmentDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.sendSupportAdjustmentNote(
      role as Role | undefined,
      subjectId,
      authUserId,
      payload as unknown as Record<string, unknown>,
    );
  }

  @Get()
  list(
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.list(role as Role | undefined, subjectId, limit);
  }

  @Get(':documentId')
  getDocument(
    @Param('documentId') documentId: string,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.documentsService.getDocument(documentId, role as Role | undefined, subjectId);
  }

  @Post(':documentId/retry')
  retry(
    @Param('documentId') documentId: string,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.documentsService.retry(documentId, role as Role | undefined, subjectId, authUserId);
  }

  @Post(':documentId/cache-files')
  cacheFiles(
    @Param('documentId') documentId: string,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.documentsService.cacheFiles(documentId, role as Role | undefined, subjectId);
  }

  @Get(':documentId/files/:type/url')
  getFileUrl(
    @Param('documentId') documentId: string,
    @Param('type') type: string,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.documentsService.getFileUrl(documentId, type, role as Role | undefined, subjectId);
  }
}
