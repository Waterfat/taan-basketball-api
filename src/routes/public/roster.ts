import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { getCurrentSeason } from '../../utils/season.js';

const ATT_MAP: Record<string, number | string> = { PRESENT: 1, ABSENT: 0, AWOL: 'x', UNKNOWN: '?' };

export default async function rosterRoute(fastify: FastifyInstance) {
  fastify.get('/roster', async () => {
    const season = await getCurrentSeason();
    if (!season) return { weeks: [], teams: [] };

    const weeks = await prisma.week.findMany({
      where: { seasonId: season.id, type: 'GAME' },
      orderBy: { weekNum: 'asc' },
    });

    const teamSeasons = await prisma.teamSeason.findMany({
      where: { seasonId: season.id },
      include: {
        team: true,
        players: {
          include: {
            player: true,
            attendance: { orderBy: { week: { weekNum: 'asc' } } },
          },
        },
      },
    });

    const weekHeaders = weeks.map((w) => ({
      wk: w.weekNum,
      label: `第${w.weekNum}週`,
      date: `${w.date.getMonth() + 1}/${w.date.getDate()}`,
    }));

    const teams = teamSeasons.map((ts) => ({
      id: ts.team.code,
      name: ts.team.name,
      players: ts.players.map((ps) => {
        const attMap = new Map(ps.attendance.map((a) => [a.weekId, a.status]));
        const att = weeks.map((w) => {
          const status = attMap.get(w.id);
          return status ? ATT_MAP[status] ?? '?' : '?';
        });
        return { name: ps.player.name, att };
      }),
    }));

    return { weeks: weekHeaders, teams };
  });
}
