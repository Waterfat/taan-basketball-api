import prisma from '../prisma.js';
import type { AttStatus } from '@prisma/client';

export async function getByWeek(weekId: number) {
  return prisma.attendance.findMany({
    where: { weekId },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });
}

export async function getBySeason(seasonId: number) {
  const weeks = await prisma.week.findMany({
    where: { seasonId, type: 'GAME' },
    orderBy: { weekNum: 'asc' },
    select: { id: true, weekNum: true, date: true },
  });
  const records = await prisma.attendance.findMany({
    where: { weekId: { in: weeks.map((w) => w.id) } },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });
  return { weeks, records };
}

export async function batchUpsert(entries: Array<{ weekId: number; playerSeasonId: number; status: AttStatus }>) {
  return prisma.$transaction(
    entries.map((e) =>
      prisma.attendance.upsert({
        where: { weekId_playerSeasonId: { weekId: e.weekId, playerSeasonId: e.playerSeasonId } },
        create: e,
        update: { status: e.status },
      })
    )
  );
}
