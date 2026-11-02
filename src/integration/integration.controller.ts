import { Body, Controller, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { UpsertAliaddoApiKeyDto } from './dto/upsert-aliaddo-api-key.dto';
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
