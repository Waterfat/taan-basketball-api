import prisma from '../prisma.js';

export interface LeaderEntry {
  name: string;
  team: string;
  val: number;
  p2?: string;
  p3?: string;
  ft?: string;
  off?: number;
  def?: number;
}

export async function getBySeason(seasonId: number) {
  const stats = await prisma.playerGameStat.findMany({
    where: { game: { week: { seasonId } }, played: true },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });

  type StatKey = 'pts' | 'oreb' | 'dreb' | 'treb' | 'ast' | 'blk' | 'stl' | 'tov' | 'fg2Made' | 'fg2Miss' | 'fg3Made' | 'fg3Miss' | 'ftMade' | 'ftMiss';
  const STAT_KEYS: StatKey[] = ['pts', 'oreb', 'dreb', 'treb', 'ast', 'blk', 'stl', 'tov', 'fg2Made', 'fg2Miss', 'fg3Made', 'fg3Miss', 'ftMade', 'ftMiss'];

  const playerMap = new Map<number, { name: string; team: string; games: number; totals: Record<StatKey, number> }>();

  for (const s of stats) {
    const key = s.playerSeasonId;
    const entry = playerMap.get(key) ?? {
      name: s.playerSeason.player.name,
      team: s.playerSeason.teamSeason.team.shortName,
      games: 0,
      totals: { pts: 0, oreb: 0, dreb: 0, treb: 0, ast: 0, blk: 0, stl: 0, tov: 0, fg2Made: 0, fg2Miss: 0, fg3Made: 0, fg3Miss: 0, ftMade: 0, ftMiss: 0 },
    };
    entry.games++;
    for (const k of STAT_KEYS) {
      entry.totals[k] += s[k];
    }
    playerMap.set(key, entry);
  }

  const players = [...playerMap.values()].filter((p) => p.games > 0);
  const avg = (total: number, gp: number) => Math.round((total / gp) * 100) / 100;
  const pct = (made: number, miss: number) => {
    const att = made + miss;
    return att > 0 ? `${((made / att) * 100).toFixed(1)}%` : '-';
  };

  // Single pass: compute all category entries at once
  const scoring: LeaderEntry[] = [];
  const rebound: LeaderEntry[] = [];
  const assist: LeaderEntry[] = [];
  const steal: LeaderEntry[] = [];
  const block: LeaderEntry[] = [];
  const eff: LeaderEntry[] = [];

  for (const p of players) {
    const t = p.totals;
    const gp = p.games;

    scoring.push({
      name: p.name, team: p.team,
      val: avg(t.pts, gp),
      p2: pct(t.fg2Made, t.fg2Miss),
      p3: pct(t.fg3Made, t.fg3Miss),
      ft: pct(t.ftMade, t.ftMiss),
    });

    rebound.push({
      name: p.name, team: p.team,
      val: avg(t.treb, gp),
      off: avg(t.oreb, gp),
      def: avg(t.dreb, gp),
    });

    assist.push({ name: p.name, team: p.team, val: avg(t.ast, gp) });
    steal.push({ name: p.name, team: p.team, val: avg(t.stl, gp) });
    block.push({ name: p.name, team: p.team, val: avg(t.blk, gp) });

    const fga = t.fg2Made + t.fg2Miss + t.fg3Made + t.fg3Miss;
    const fgm = t.fg2Made + t.fg3Made;
    const fta = t.ftMade + t.ftMiss;
    const effVal = (t.pts + t.treb + t.ast + t.stl + t.blk - (fga - fgm) - (fta - t.ftMade) - t.tov) / gp;
    eff.push({ name: p.name, team: p.team, val: Math.round(effVal * 100) / 100 });
  }

  // Sort each category descending by val
  const desc = (a: LeaderEntry, b: LeaderEntry) => b.val - a.val;
  scoring.sort(desc);
  rebound.sort(desc);
  assist.sort(desc);
  steal.sort(desc);
  block.sort(desc);
  eff.sort(desc);

  return { scoring, rebound, assist, steal, block, eff };
}
