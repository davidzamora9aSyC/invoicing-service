import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationModule } from './integration/integration.module';
import { DocumentsModule } from './documents/documents.module';
import { S3Module } from './storage/s3.module';
import { IssuerModule } from './issuer/issuer.module';
import { AliaddoModule } from './aliaddo/aliaddo.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OperationsModule } from './operations/operations.module';
import { ImportModule } from './import/import.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { CatalogsModule } from './catalogs/catalogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RabbitmqModule,
    IssuerModule,
    AliaddoModule,
    S3Module,
    IntegrationModule,
    DocumentsModule,
    ResolutionsModule,
    OperationsModule,
    ImportModule,
    CatalogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
