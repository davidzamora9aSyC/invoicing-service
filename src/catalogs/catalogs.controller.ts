import { Controller, Get, Query } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('municipalities')
  searchMunicipalities(
    @Query('q') q?: string,
    @Query('departmentCode') departmentCode?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogsService.searchMunicipalities({
      q,
      departmentCode,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('ciiu/search')
  searchCiiu(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogsService.searchCiiu({
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
