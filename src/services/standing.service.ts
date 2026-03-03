import prisma from '../prisma.js';

export async function getBySeason(seasonId: number) {
  return prisma.standing.findMany({
    where: { seasonId },
    include: { season: true },
    orderBy: { rank: 'asc' },
  });
}

export async function recalculate(seasonId: number) {
  const games = await prisma.game.findMany({
    where: { week: { seasonId }, status: 'FINISHED' },
    include: { homeTeam: true, awayTeam: true },
  });

  const stats = new Map<number, { wins: number; losses: number; results: ('W' | 'L')[] }>();

  for (const g of games) {
    if (g.homeScore == null || g.awayScore == null) continue;
    const homeWin = g.homeScore > g.awayScore;

    for (const [tsId, won] of [[g.homeTeamId, homeWin], [g.awayTeamId, !homeWin]] as [number, boolean][]) {
      const s = stats.get(tsId) ?? { wins: 0, losses: 0, results: [] };
      if (won) s.wins++; else s.losses++;
      s.results.push(won ? 'W' : 'L');
      stats.set(tsId, s);
    }
  }

  const entries = [...stats.entries()]
    .map(([tsId, s]) => ({
      teamSeasonId: tsId,
      wins: s.wins,
      losses: s.losses,
      pct: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
      streak: calcStreak(s.results),
    }))
    .sort((a, b) => b.pct - a.pct || b.wins - a.wins);

  await prisma.$transaction(async (tx) => {
    await tx.standing.deleteMany({ where: { seasonId } });
    for (let i = 0; i < entries.length; i++) {
      await tx.standing.create({ data: { seasonId, ...entries[i], rank: i + 1 } });
    }
  });

  return entries;
}

function calcStreak(results: ('W' | 'L')[]): number {
  if (results.length === 0) return 0;
  const last = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) count++;
  return last === 'W' ? count : -count;
}
