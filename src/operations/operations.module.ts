import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';
import { OperationsService } from './operations.service';

@Module({
  imports: [PrismaModule, DocumentsModule],
  providers: [OperationsService],
})
export class OperationsModule {}

