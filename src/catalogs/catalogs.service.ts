import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type MunicipalityRow = {
  code: string;
  name: string;
};

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCiiu(params: { q?: string; limit?: number }) {
    const qRaw = params.q?.trim() ?? '';
    const q = qRaw.toLowerCase();
    if (q.length < 2) return [];

    const limit = Math.min(Math.max(params.limit ?? 30, 1), 50);
    const like = `%${q}%`;

    const rows = await this.prisma.$queryRaw<Array<{ code: string; description: string }>>`
      SELECT "code", "description"
      FROM "invoicing"."CiiuClass"
      WHERE "active" = true
        AND (
          LOWER("code") LIKE ${like}
          OR unaccent(LOWER("description")) LIKE unaccent(${like})
        )
      ORDER BY "code" ASC
      LIMIT ${limit}
    `;

    return rows;
  }

  async searchMunicipalities(params: { q?: string; departmentCode?: string; limit?: number }) {
    const q = params.q?.trim().toLowerCase() ?? '';
    if (q.length < 2) return [];

    const departmentCode = params.departmentCode?.trim() || undefined;
    const limit = Math.min(Math.max(params.limit ?? 30, 1), 50);
    const like = `%${q}%`;

    const clauses: Prisma.Sql[] = [
      Prisma.sql`"active" = true`,
      Prisma.sql`(LOWER("code") LIKE ${like} OR unaccent(LOWER("name")) LIKE unaccent(${like}))`,
    ];

    if (departmentCode) {
      clauses.push(Prisma.sql`LEFT("code", 2) = ${departmentCode}`);
    }

    const where = Prisma.join(clauses, ' AND ');

    const rows = await this.prisma.$queryRaw<MunicipalityRow[]>`
      SELECT "code", "name"
      FROM "interoperability"."RdaMunicipality"
      WHERE ${where}
      ORDER BY "name" ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      departmentCode: row.code?.slice(0, 2) ?? null,
    }));
  }
}
