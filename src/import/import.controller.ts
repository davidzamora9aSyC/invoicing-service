import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ImportCsvDto } from './dto/import-csv.dto';
import { ImportService } from './import.service';
import type { Role } from '../issuer/issuer.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('csv')
  importCsv(
    @Body() dto: ImportCsvDto,
    @Headers('x-role') role?: string,
    @Headers('x-subject-id') subjectId?: string,
    @Headers('x-auth-user-id') authUserId?: string,
  ) {
    return this.importService.importCsv({
      csvText: dto.csvText,
      dryRun: dto.dryRun === true,
      role: role as Role | undefined,
      subjectId,
      authUserId,
    });
  }
}

