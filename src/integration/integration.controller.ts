import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { UpsertAliaddoApiKeyDto } from './dto/upsert-aliaddo-api-key.dto';
import { AuthorizeFacilFacturaDto, PrepareFacilFacturaDto, RejectFacilFacturaDto } from './dto/authorize-facil-factura.dto';
import { RequestFacilFacturaActivationDto } from './dto/request-facil-factura-activation.dto';
import { UpsertDianTestSetDto } from './dto/upsert-dian-testset.dto';
import { SaveInvoicingOnboardingDraftDto } from './dto/save-invoicing-onboarding-draft.dto';
import { SubmitInvoicingOnboardingDto } from './dto/submit-invoicing-onboarding.dto';
import { IntegrationService } from './integration.service';
import type { Role } from '../issuer/issuer.service';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('me')
  getMe(
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.getMe(role as Role | undefined, subjectId);
  }

  @Put('me/dian-test-set-id')
  upsertDianTestSetId(
    @Body() dto: UpsertDianTestSetDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.upsertDianTestSetId(
      role as Role | undefined,
      subjectId,
      dto.dianTestSetId,
    );
  }

  @Post('me/facil-factura/request')
  requestFacilFacturaActivation(
    @Body() dto: RequestFacilFacturaActivationDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.requestFacilFacturaActivation(
      role as Role | undefined,
      subjectId,
      dto,
    );
  }

  @Put('me/aliaddo-api-key')
  upsertAliaddoApiKey(
    @Body() dto: UpsertAliaddoApiKeyDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.upsertAliaddoApiKey(
      role as Role | undefined,
      subjectId,
      dto.apiKey,
    );
  }

  @Put('me/onboarding')
  submitOnboarding(
    @Body() dto: SubmitInvoicingOnboardingDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.submitOnboardingMe(
      role as Role | undefined,
      subjectId,
      dto,
    );
  }

  @Put('me/onboarding/draft')
  saveOnboardingDraft(
    @Body() dto: SaveInvoicingOnboardingDraftDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    return this.integrationService.saveOnboardingDraftMe(
      role as Role | undefined,
      subjectId,
      dto,
    );
  }

  @Get('admin/onboarding/pending')
  listPendingOnboarding(
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.integrationService.listPendingOnboardingAdmin(
      role as Role | undefined,
      authUserId,
      {
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      },
    );
  }

  @Get('admin/facil-factura/requests')
  listFacilFacturaRequests(
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.listFacilFacturaRequests(role as Role | undefined, authUserId);
  }

  @Get('admin/facil-factura/issuers')
  listFacilFacturaIssuers(
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.listFacilFacturaIssuers(role as Role | undefined, authUserId);
  }

  @Put('admin/facil-factura/prepare')
  prepareFacilFactura(
    @Body() dto: PrepareFacilFacturaDto,
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.prepareFacilFactura(role as Role | undefined, authUserId, dto);
  }

  @Put('admin/facil-factura/:integrationId/authorize')
  authorizeFacilFactura(
    @Body() dto: AuthorizeFacilFacturaDto,
    @Param('integrationId') integrationId: string,
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.authorizeFacilFactura(
      role as Role | undefined,
      authUserId,
      integrationId,
      dto,
    );
  }

  @Put('admin/facil-factura/:integrationId/reject')
  rejectFacilFactura(
    @Body() dto: RejectFacilFacturaDto,
    @Param('integrationId') integrationId: string,
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.rejectFacilFactura(
      role as Role | undefined,
      authUserId,
      integrationId,
      dto?.notes,
    );
  }

  @Put('admin/onboarding/:integrationId/review')
  reviewOnboarding(
    @Body() dto: { approve: boolean; notes?: string; aliaddoApiKey?: string },
    @Param('integrationId') integrationId: string,
    @Headers('x-role') role?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.integrationService.reviewOnboardingAdmin({
      role: role as Role | undefined,
      authUserId,
      integrationId,
      approve: Boolean(dto?.approve),
      notes: dto?.notes,
      aliaddoApiKey: dto?.aliaddoApiKey,
    });
  }
}
