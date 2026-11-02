import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IssuerModule } from '../issuer/issuer.module';
import { IntegrationController } from './integration.controller';
import { IntegrationSecretsService } from './integration-secrets.service';
import { IntegrationService } from './integration.service';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, IssuerModule, RabbitmqModule],
  controllers: [IntegrationController],
  providers: [IntegrationService, IntegrationSecretsService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
