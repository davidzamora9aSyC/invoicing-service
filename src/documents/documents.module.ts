import { Module } from '@nestjs/common';
import { AliaddoModule } from '../aliaddo/aliaddo.module';
import { IssuerModule } from '../issuer/issuer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../storage/s3.module';
import { IntegrationModule } from '../integration/integration.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, IssuerModule, AliaddoModule, S3Module, IntegrationModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
