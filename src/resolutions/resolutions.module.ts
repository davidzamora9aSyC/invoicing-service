import { Module } from '@nestjs/common';
import { AliaddoModule } from '../aliaddo/aliaddo.module';
import { IntegrationModule } from '../integration/integration.module';
import { ResolutionsController } from './resolutions.controller';

@Module({
  imports: [AliaddoModule, IntegrationModule],
  controllers: [ResolutionsController],
})
export class ResolutionsModule {}
