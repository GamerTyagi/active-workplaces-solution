import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const grouped = await prisma.shift.groupBy({
    by: ["workplaceId"],
    _count: { _all: true },
  });

  // Sort by shift count DESC
  grouped.sort(
    (a, b) =>
      ((b._count as any)._all ?? 0) - ((a._count as any)._all ?? 0)
  );

  const workplaceIds = grouped.map((g) => g.workplaceId);

  const workplaces = await prisma.workplace.findMany({
    where: { id: { in: workplaceIds } },
  });

  const map = new Map(workplaces.map((w) => [w.id, w]));

  const result = grouped.map((g) => ({
    workplace: map.get(g.workplaceId),
    shiftCount: (g._count as any)._all,
  }));

  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
