import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { DUTY_LABEL, DUTY_ICON, DUTY_TYPES } from '../../utils/constants.js';

export default async function rotationRoute(fastify: FastifyInstance) {
  fastify.get('/rotation', async () => {
    const season = await prisma.season.findFirst({ where: { isCurrent: true } });
    if (!season) return { season: 0, currentWeek: 0, attendance: {}, absentees: [], assignments: [], cumulativeRanking: [] };

    const latestWeek = await prisma.week.findFirst({
      where: { seasonId: season.id, type: 'GAME', games: { some: { status: 'FINISHED' } } },
      orderBy: { weekNum: 'desc' },
      include: { games: true },
    });
    if (!latestWeek) return { season: season.number, currentWeek: 0, attendance: {}, absentees: [], assignments: [], cumulativeRanking: [] };

    // Attendance for latest week
    const att = await prisma.attendance.findMany({
      where: { weekId: latestWeek.id },
      include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
    });
    const present = att.filter((a) => a.status === 'PRESENT').length;
    const absent = att.filter((a) => a.status !== 'PRESENT' && a.status !== 'UNKNOWN').length;
    const absentees = att
      .filter((a) => a.status !== 'PRESENT' && a.status !== 'UNKNOWN')
      .map((a) => `${a.playerSeason.player.name}(${a.playerSeason.teamSeason.team.shortName})`);

    // Duties for latest week's games
    const duties = await prisma.dutyRecord.findMany({
      where: { gameId: { in: latestWeek.games.map((g) => g.id) } },
      include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
    });

    const byType = new Map<string, { name: string; team: string; count: number }[]>();
    for (const d of duties) {
      const list = byType.get(d.dutyType) ?? [];
      const existing = list.find((e) => e.name === d.playerSeason.player.name);
      if (existing) existing.count++;
      else list.push({ name: d.playerSeason.player.name, team: d.playerSeason.teamSeason.team.shortName, count: 1 });
      byType.set(d.dutyType, list);
    }

    const assignments = DUTY_TYPES
      .map((type) => ({
        role: DUTY_LABEL[type] ?? type,
        icon: DUTY_ICON[type] ?? '',
        staff: byType.get(type) ?? [],
      }));

    // Cumulative ranking
    const allDuties = await prisma.dutyRecord.findMany({
      where: { game: { week: { seasonId: season.id } } },
      include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
    });

    const cumMap = new Map<number, { name: string; team: string; referee: number; court: number; photo: number; equip: number; data: number }>();
    for (const d of allDuties) {
      const entry = cumMap.get(d.playerSeasonId) ?? {
        name: d.playerSeason.player.name,
        team: d.playerSeason.teamSeason.team.shortName,
        referee: 0, court: 0, photo: 0, equip: 0, data: 0,
      };
      if (d.dutyType === 'REFEREE') entry.referee++;
      else if (d.dutyType === 'COURT') entry.court++;
      else if (d.dutyType === 'PHOTO') entry.photo++;
      else if (d.dutyType === 'EQUIPMENT') entry.equip++;
      else if (d.dutyType === 'DATA') entry.data++;
      cumMap.set(d.playerSeasonId, entry);
    }

    const cumulativeRanking = [...cumMap.values()]
      .map((e) => ({ ...e, total: e.referee + e.court + e.photo + e.equip + e.data }))
      .sort((a, b) => b.total - a.total)
      .map((e, i) => ({ rank: i + 1, ...e }));

    return {
      season: season.number,
      currentWeek: latestWeek.weekNum,
      attendance: { present, absent },
      absentees,
      assignments,
      cumulativeRanking,
    };
  });
}
