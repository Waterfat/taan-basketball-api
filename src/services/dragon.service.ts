import prisma from '../prisma.js';

export async function getBySeason(seasonId: number) {
  return prisma.dragonScore.findMany({
    where: { seasonId },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
    orderBy: { totalPoints: 'desc' },
  });
}

export async function recalculate(seasonId: number) {
  const teamSeasons = await prisma.teamSeason.findMany({
    where: { seasonId },
    include: { players: { include: { attendance: true, dutyRecords: true } } },
  });

  const ops = [];
  for (const ts of teamSeasons) {
    for (const ps of ts.players) {
      const attPoints = ps.attendance.filter((a) => a.status === 'PRESENT').length;
      const dutyPoints = ps.dutyRecords.length;

      const existing = await prisma.dragonScore.findUnique({
        where: { seasonId_playerSeasonId: { seasonId, playerSeasonId: ps.id } },
      });
      const mopPoints = existing?.mopPoints ?? 0;
      const playoffPoints = existing?.playoffPoints ?? null;
      const totalPoints = attPoints + dutyPoints + mopPoints + (playoffPoints ?? 0);

      ops.push(
        prisma.dragonScore.upsert({
          where: { seasonId_playerSeasonId: { seasonId, playerSeasonId: ps.id } },
          create: { seasonId, playerSeasonId: ps.id, attPoints, dutyPoints, mopPoints, playoffPoints, totalPoints },
          update: { attPoints, dutyPoints, totalPoints },
        })
      );
    }
  }

  await prisma.$transaction(ops);
  return getBySeason(seasonId);
}

export async function manualAdjust(id: number, data: Partial<{ mopPoints: number; playoffPoints: number }>) {
  const existing = await prisma.dragonScore.findUnique({ where: { id } });
  if (!existing) return null;
  const mop = data.mopPoints ?? existing.mopPoints;
  const playoff = data.playoffPoints ?? existing.playoffPoints;
  const totalPoints = existing.attPoints + existing.dutyPoints + mop + (playoff ?? 0);
  return prisma.dragonScore.update({ where: { id }, data: { ...data, totalPoints } });
}
