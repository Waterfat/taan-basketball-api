import prisma from '../prisma.js';

interface LeaderEntry {
  name: string;
  team: string;
  val: number;
  [key: string]: any;
}

export async function getBySeason(seasonId: number) {
  const stats = await prisma.playerGameStat.findMany({
    where: { game: { week: { seasonId } }, played: true },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });

  const playerMap = new Map<number, { name: string; team: string; games: number; totals: Record<string, number> }>();

  for (const s of stats) {
    const key = s.playerSeasonId;
    const entry = playerMap.get(key) ?? {
      name: s.playerSeason.player.name,
      team: s.playerSeason.teamSeason.team.shortName,
      games: 0,
      totals: { pts: 0, oreb: 0, dreb: 0, treb: 0, ast: 0, blk: 0, stl: 0, tov: 0, fg2Made: 0, fg2Miss: 0, fg3Made: 0, fg3Miss: 0, ftMade: 0, ftMiss: 0 },
    };
    entry.games++;
    for (const k of Object.keys(entry.totals)) {
      entry.totals[k] += (s as any)[k] ?? 0;
    }
    playerMap.set(key, entry);
  }

  const players = [...playerMap.values()].filter((p) => p.games > 0);
  const avg = (total: number, gp: number) => Math.round((total / gp) * 100) / 100;
  const pct = (made: number, miss: number) => {
    const att = made + miss;
    return att > 0 ? `${((made / att) * 100).toFixed(1)}%` : '-';
  };

  const scoring: LeaderEntry[] = players
    .map((p) => ({
      name: p.name, team: p.team,
      val: avg(p.totals.pts, p.games),
      p2: pct(p.totals.fg2Made, p.totals.fg2Miss),
      p3: pct(p.totals.fg3Made, p.totals.fg3Miss),
      ft: pct(p.totals.ftMade, p.totals.ftMiss),
    }))
    .sort((a, b) => b.val - a.val);

  const rebound: LeaderEntry[] = players
    .map((p) => ({ name: p.name, team: p.team, val: avg(p.totals.treb, p.games), off: avg(p.totals.oreb, p.games), def: avg(p.totals.dreb, p.games) }))
    .sort((a, b) => b.val - a.val);

  const assist: LeaderEntry[] = players.map((p) => ({ name: p.name, team: p.team, val: avg(p.totals.ast, p.games) })).sort((a, b) => b.val - a.val);
  const steal: LeaderEntry[] = players.map((p) => ({ name: p.name, team: p.team, val: avg(p.totals.stl, p.games) })).sort((a, b) => b.val - a.val);
  const block: LeaderEntry[] = players.map((p) => ({ name: p.name, team: p.team, val: avg(p.totals.blk, p.games) })).sort((a, b) => b.val - a.val);

  const eff: LeaderEntry[] = players
    .map((p) => {
      const t = p.totals;
      const fga = t.fg2Made + t.fg2Miss + t.fg3Made + t.fg3Miss;
      const fgm = t.fg2Made + t.fg3Made;
      const fta = t.ftMade + t.ftMiss;
      const effVal = (t.pts + t.treb + t.ast + t.stl + t.blk - (fga - fgm) - (fta - t.ftMade) - t.tov) / p.games;
      return { name: p.name, team: p.team, val: Math.round(effVal * 100) / 100 };
    })
    .sort((a, b) => b.val - a.val);

  return { scoring, rebound, assist, steal, block, eff };
}
