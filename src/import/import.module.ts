import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [DocumentsModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}

