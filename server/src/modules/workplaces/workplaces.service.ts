async getMostActive({
  from,
  to,
  limit = 10,
}: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(0);

  const grouped = await this.prisma.shift.groupBy({
    by: ["workplaceId"],
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _count: { _all: true },
  });

  // ⭐ Manual sorting because Prisma version does not support orderBy aggregate
  grouped.sort(
    (a, b) =>
      ((b._count as any)._all ?? 0) - ((a._count as any)._all ?? 0)
  );

  // Apply limit
  const limited = grouped.slice(0, limit);

  const workplaceIds = limited.map((g) => g.workplaceId);

  const workplaces = await this.prisma.workplace.findMany({
    where: { id: { in: workplaceIds } },
  });

  const map = new Map(workplaces.map((w) => [w.id, w]));

  return limited.map((g) => ({
    workplace: map.get(g.workplaceId),
    shiftCount: (g._count as any)._all,
  }));
}
