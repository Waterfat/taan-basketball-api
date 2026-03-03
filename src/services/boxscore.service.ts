import prisma from '../prisma.js';

interface StatInput {
  playerSeasonId: number;
  isHome: boolean;
  played?: boolean;
  fg2Made?: number; fg2Miss?: number;
  fg3Made?: number; fg3Miss?: number;
  ftMade?: number; ftMiss?: number;
  oreb?: number; dreb?: number;
  ast?: number; blk?: number; stl?: number; tov?: number; pf?: number;
}

function calcDerived(s: StatInput) {
  const fg2 = (s.fg2Made ?? 0) * 2;
  const fg3 = (s.fg3Made ?? 0) * 3;
  const ft = s.ftMade ?? 0;
  return {
    pts: fg2 + fg3 + ft,
    treb: (s.oreb ?? 0) + (s.dreb ?? 0),
  };
}

export async function getByGame(gameId: number) {
  return prisma.playerGameStat.findMany({
    where: { gameId },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
    orderBy: [{ isHome: 'desc' }, { playerSeason: { player: { name: 'asc' } } }],
  });
}

export async function batchUpsert(gameId: number, stats: StatInput[]) {
  return prisma.$transaction(
    stats.map((s) => {
      const derived = calcDerived(s);
      const data = {
        gameId,
        playerSeasonId: s.playerSeasonId,
        isHome: s.isHome,
        played: s.played ?? true,
        fg2Made: s.fg2Made ?? 0, fg2Miss: s.fg2Miss ?? 0,
        fg3Made: s.fg3Made ?? 0, fg3Miss: s.fg3Miss ?? 0,
        ftMade: s.ftMade ?? 0, ftMiss: s.ftMiss ?? 0,
        pts: derived.pts, oreb: s.oreb ?? 0, dreb: s.dreb ?? 0, treb: derived.treb,
        ast: s.ast ?? 0, blk: s.blk ?? 0, stl: s.stl ?? 0, tov: s.tov ?? 0, pf: s.pf ?? 0,
      };
      return prisma.playerGameStat.upsert({
        where: { gameId_playerSeasonId: { gameId, playerSeasonId: s.playerSeasonId } },
        create: data,
        update: data,
      });
    })
  );
}

export async function updateStat(id: number, data: Partial<StatInput>) {
  const existing = await prisma.playerGameStat.findUnique({ where: { id } });
  if (!existing) return null;
  const merged = { ...existing, ...data };
  const derived = calcDerived(merged as StatInput);
  return prisma.playerGameStat.update({
    where: { id },
    data: { ...data, pts: derived.pts, treb: derived.treb },
  });
}
