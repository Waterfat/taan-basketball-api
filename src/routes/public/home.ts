import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

const PHASE_MAP: Record<string, string> = { PRESEASON: '熱身賽', REGULAR: '例行賽', PLAYOFF: '季後賽' };

export default async function homeRoute(fastify: FastifyInstance) {
  fastify.get('/home', async () => {
    const season = await prisma.season.findFirst({ where: { isCurrent: true } });
    if (!season) return { season: 0, currentWeek: 0, phase: '', scheduleInfo: {}, standings: [], dragonTop10: [], miniStats: {} };

    // Latest week with finished games
    const latestWeek = await prisma.week.findFirst({
      where: { seasonId: season.id, type: 'GAME', games: { some: { status: 'FINISHED' } } },
      orderBy: { weekNum: 'desc' },
    });

    // Next week (for schedule info)
    const nextWeek = await prisma.week.findFirst({
      where: { seasonId: season.id, type: 'GAME', weekNum: { gt: latestWeek?.weekNum ?? 0 } },
      orderBy: { weekNum: 'asc' },
    }) ?? latestWeek;

    // Standings
    const standings = await prisma.standing.findMany({
      where: { seasonId: season.id },
      orderBy: { rank: 'asc' },
    });
    const teamSeasons = await prisma.teamSeason.findMany({
      where: { seasonId: season.id },
      include: { team: true },
    });
    const tsMap = new Map(teamSeasons.map((ts) => [ts.id, ts]));

    const standingsData = standings.map((s) => {
      const ts = tsMap.get(s.teamSeasonId);
      const team = ts?.team;
      const streakType = s.streak >= 0 ? 'win' : 'lose';
      return {
        rank: s.rank,
        name: `${team?.shortName ?? '?'}隊`,
        team: team?.shortName ?? '?',
        wins: s.wins,
        losses: s.losses,
        record: `${s.wins}勝 ${s.losses}敗`,
        pct: `${(s.pct * 100).toFixed(1)}%`,
        history: [] as string[], // computed from games if needed
        streak: `${Math.abs(s.streak)}連${s.streak >= 0 ? '勝' : '敗'}`,
        streakType,
      };
    });

    // Dragon top 10
    const dragonScores = await prisma.dragonScore.findMany({
      where: { seasonId: season.id },
      include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
      orderBy: { totalPoints: 'desc' },
      take: 10,
    });
    const dragonTop10 = dragonScores.map((d, i) => ({
      rank: i + 1,
      name: d.playerSeason.player.name,
      team: d.playerSeason.teamSeason.team.shortName,
      att: d.attPoints,
      duty: d.dutyPoints,
      total: d.totalPoints,
    }));

    return {
      season: season.number,
      currentWeek: latestWeek?.weekNum ?? 0,
      phase: latestWeek ? PHASE_MAP[latestWeek.phase] ?? latestWeek.phase : '',
      scheduleInfo: nextWeek ? {
        date: formatDate(nextWeek.date),
        venue: nextWeek.venue ? `${nextWeek.venue}體育館` : '',
      } : {},
      standings: standingsData,
      dragonTop10,
      miniStats: {}, // computed from leaders if needed
    };
  });
}

function formatDate(d: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()} / ${d.getMonth() + 1} / ${d.getDate()}（${days[d.getDay()]}）07:30`;
}
