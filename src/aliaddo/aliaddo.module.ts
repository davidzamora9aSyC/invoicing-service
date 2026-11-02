import { Module } from '@nestjs/common';
import { AliaddoService } from './aliaddo.service';

@Module({
  providers: [AliaddoService],
  exports: [AliaddoService],
})
export class AliaddoModule {}

