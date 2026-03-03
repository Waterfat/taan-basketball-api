import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { PHASE_MAP, STATUS_MAP, DUTY_LABEL } from '../../utils/constants.js';
import { formatDateSimple } from '../../utils/date.js';
import { getCurrentSeason } from '../../utils/season.js';

interface ScheduleMatchup {
  combo: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface ScheduleGame {
  num: number;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  staff: Record<string, string[]>;
}

interface SuspendedWeek {
  type: 'suspended';
  date: string;
  venue: string;
  reason: string;
}

interface GameWeek {
  type: 'game';
  week: number;
  date: string;
  phase: string;
  venue: string;
  matchups: ScheduleMatchup[];
  games: ScheduleGame[];
}

type ScheduleWeekEntry = SuspendedWeek | GameWeek;

export default async function scheduleRoute(fastify: FastifyInstance) {
  fastify.get('/schedule', async () => {
    const season = await getCurrentSeason();
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
    const allWeeks: ScheduleWeekEntry[] = [];
    const weeksMap: Record<string, GameWeek> = {};

    for (const w of weeks) {
      if (w.type === 'SUSPENDED') {
        allWeeks.push({ type: 'suspended', date: formatDateSimple(w.date), venue: w.venue, reason: w.reason ?? '' });
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
          const roleName = DUTY_LABEL[d.dutyType] ?? d.dutyType;
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

      const weekData: GameWeek = {
        type: 'game', week: w.weekNum, date: formatDateSimple(w.date),
        phase: PHASE_MAP[w.phase] ?? w.phase, venue: w.venue,
        matchups, games,
      };

      allWeeks.push(weekData);
      weeksMap[String(w.weekNum)] = weekData;
    }

    return { season: season.number, currentWeek, allWeeks, weeks: weeksMap };
  });
}
