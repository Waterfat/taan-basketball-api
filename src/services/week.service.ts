import prisma from '../prisma.js';
import type { Phase, WeekType } from '@prisma/client';

export async function list(seasonId: number) {
  return prisma.week.findMany({
    where: { seasonId },
    include: { games: { include: { homeTeam: { include: { team: true } }, awayTeam: { include: { team: true } } }, orderBy: { gameNum: 'asc' } } },
    orderBy: { weekNum: 'asc' },
  });
}

export async function getById(id: number) {
  return prisma.week.findUnique({
    where: { id },
    include: { games: { include: { homeTeam: { include: { team: true } }, awayTeam: { include: { team: true } } }, orderBy: { gameNum: 'asc' } } },
  });
}

export async function create(data: { seasonId: number; weekNum: number; date: string; phase: Phase; venue: string; type?: WeekType; reason?: string }) {
  return prisma.week.create({
    data: { ...data, date: new Date(data.date), type: data.type ?? 'GAME' },
  });
}

export async function update(id: number, data: Partial<{ date: string; phase: Phase; venue: string; type: WeekType; reason: string }>) {
  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  return prisma.week.update({ where: { id }, data: updateData });
}

export async function generateGames(weekId: number, matchups: Array<{ gameNum: number; homeTeamSeasonId: number; awayTeamSeasonId: number; scheduledTime?: string }>) {
  return prisma.$transaction(
    matchups.map((m) =>
      prisma.game.upsert({
        where: { weekId_gameNum: { weekId, gameNum: m.gameNum } },
        create: { weekId, gameNum: m.gameNum, homeTeamId: m.homeTeamSeasonId, awayTeamId: m.awayTeamSeasonId, scheduledTime: m.scheduledTime },
        update: { homeTeamId: m.homeTeamSeasonId, awayTeamId: m.awayTeamSeasonId, scheduledTime: m.scheduledTime },
      })
    )
  );
}
