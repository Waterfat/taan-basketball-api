import prisma from '../prisma.js';
import type { GameStatus } from '@prisma/client';

export async function list(filters?: { weekId?: number; seasonId?: number; status?: GameStatus }) {
  const where: any = {};
  if (filters?.weekId) where.weekId = filters.weekId;
  if (filters?.status) where.status = filters.status;
  if (filters?.seasonId) where.week = { seasonId: filters.seasonId };
  return prisma.game.findMany({
    where,
    include: {
      week: true,
      homeTeam: { include: { team: true } },
      awayTeam: { include: { team: true } },
    },
    orderBy: [{ week: { weekNum: 'asc' } }, { gameNum: 'asc' }],
  });
}

export async function getById(id: number) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      week: true,
      homeTeam: { include: { team: true } },
      awayTeam: { include: { team: true } },
      playerStats: { include: { playerSeason: { include: { player: true } } }, orderBy: { isHome: 'desc' } },
      duties: { include: { playerSeason: { include: { player: true } } } },
    },
  });
}

export async function update(id: number, data: Partial<{ homeScore: number; awayScore: number; status: GameStatus; scheduledTime: string; recorder: string }>) {
  return prisma.game.update({ where: { id }, data });
}
