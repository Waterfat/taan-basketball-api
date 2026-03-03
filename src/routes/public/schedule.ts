import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

const PHASE_MAP: Record<string, string> = { PRESEASON: '熱身賽', REGULAR: '例行賽', PLAYOFF: '季後賽' };
const STATUS_MAP: Record<string, string> = { FINISHED: 'finished', UPCOMING: 'upcoming', LIVE: 'live' };

export default async function scheduleRoute(fastify: FastifyInstance) {
  fastify.get('/schedule', async () => {
    const season = await prisma.season.findFirst({ where: { isCurrent: true } });
    if (!season) return { season: 0, currentWeek: 0, allWeeks: [], weeks: {} };

    const weeks = await prisma.week.findMany({
      where: { seasonId: season.id },
      include: {
        games: {
          include: {
            homeTeam: { include: { team: true } },
            awayTeam: { include: { team: true } },
            duties: { include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } } },
          },
          orderBy: { gameNum: 'asc' },
        },
      },
      orderBy: { weekNum: 'asc' },
    });

    let currentWeek = 0;
    const allWeeks: any[] = [];
    const weeksMap: Record<string, any> = {};

    for (const w of weeks) {
      if (w.type === 'SUSPENDED') {
        allWeeks.push({ type: 'suspended', date: formatDate(w.date), venue: w.venue, reason: w.reason ?? '' });
        continue;
      }

      const hasFinished = w.games.some((g) => g.status === 'FINISHED');
      if (hasFinished) currentWeek = w.weekNum;

      const matchups = w.games.map((g, i) => ({
        combo: i + 1,
        home: g.homeTeam.team.shortName,
        away: g.awayTeam.team.shortName,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        status: STATUS_MAP[g.status] ?? 'upcoming',
      }));

      const games = w.games.map((g) => {
        const staff: Record<string, string[]> = {};
        for (const d of g.duties) {
          const roleName = dutyLabel(d.dutyType);
          const playerLabel = `${d.playerSeason.player.name}(${d.playerSeason.teamSeason.team.shortName})`;
          (staff[roleName] ??= []).push(playerLabel);
        }
        return {
          num: g.gameNum,
          time: g.scheduledTime ?? '',
          home: g.homeTeam.team.shortName,
          away: g.awayTeam.team.shortName,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          status: STATUS_MAP[g.status] ?? 'upcoming',
          staff,
        };
      });

      const weekData = {
        type: 'game', week: w.weekNum, date: formatDate(w.date),
        phase: PHASE_MAP[w.phase] ?? w.phase, venue: w.venue,
        matchups, games,
      };

      allWeeks.push(weekData);
      weeksMap[String(w.weekNum)] = weekData;
    }

    return { season: season.number, currentWeek, allWeeks, weeks: weeksMap };
  });
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function dutyLabel(type: string): string {
  const map: Record<string, string> = { REFEREE: '裁判', COURT: '場務', PHOTO: '攝影', EQUIPMENT: '器材', DATA: '數據' };
  return map[type] ?? type;
}
