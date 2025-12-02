import { Injectable } from "@nestjs/common";
import { type Workplace } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Page, PaginatedData } from "../shared/shared.types";
import { CreateWorkplace } from "./workplaces.schemas";

@Injectable()
export class WorkplacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWorkplace): Promise<Workplace> {
    return await this.prisma.workplace.create({ data });
  }

  async getById(id: number): Promise<Workplace | null> {
    return await this.prisma.workplace.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page }): Promise<PaginatedData<Workplace>> {
    const { page } = parameters;
    const databaseQueryParameters = queryParameters({ page });

    const workplaces = await this.prisma.workplace.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.workplace,
    });

    return { data: workplaces, nextPage };
async getMostActive({
  from,
  to,
  limit = 10,
}: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  // Parse dates
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(0); // beginning of time

  // Group shifts by workplaceId
  const grouped = await this.prisma.shift.groupBy({
    by: ["workplaceId"],
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _count: { _all: true },
    orderBy: {
      _count: { _all: "desc" },
    },
    take: limit,
  });

  // Fetch workplaces with IDs
  const workplaceIds = grouped.map((g) => g.workplaceId);
  const workplaces = await this.prisma.workplace.findMany({
    where: { id: { in: workplaceIds } },
  });
  const map = new Map(workplaces.map((w) => [w.id, w]));

  // Build final payload
  return grouped.map((g) => ({
    workplace: map.get(g.workplaceId),
    shiftCount: g._count._all,
  }));
}

    
  }
}
