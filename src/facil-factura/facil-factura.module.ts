import { Module } from '@nestjs/common';
import { FacilFacturaService } from './facil-factura.service';

@Module({
  providers: [FacilFacturaService],
  exports: [FacilFacturaService],
})
export class FacilFacturaModule {}
