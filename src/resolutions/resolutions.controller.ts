import { Controller, Get, Headers } from '@nestjs/common';
import { AliaddoService } from '../aliaddo/aliaddo.service';
import { IntegrationService } from '../integration/integration.service';
import type { Role } from '../issuer/issuer.service';

@Controller()
export class ResolutionsController {
  constructor(
    private readonly aliaddo: AliaddoService,
    private readonly integrationService: IntegrationService,
  ) {}

  @Get('resolutions')
  async getResolutions(
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
  ) {
    const apiKey =
      (await this.integrationService.getAliaddoApiKey(
        role as Role | undefined,
        subjectId,
      )) ?? process.env.ALIADDO_X_API_KEY;

    if (!apiKey?.trim()) {
      return this.aliaddo.get('/resolutions');
    }

    return this.aliaddo.getWithApiKey('/resolutions', apiKey);
  }
}
