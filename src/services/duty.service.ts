import prisma from '../prisma.js';
import type { DutyType } from '@prisma/client';

export async function getByGame(gameId: number) {
  return prisma.dutyRecord.findMany({
    where: { gameId },
    include: { playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });
}

export async function batchAssign(entries: Array<{ gameId: number; playerSeasonId: number; dutyType: DutyType }>) {
  return prisma.$transaction(
    entries.map((e) =>
      prisma.dutyRecord.upsert({
        where: { gameId_playerSeasonId_dutyType: { gameId: e.gameId, playerSeasonId: e.playerSeasonId, dutyType: e.dutyType } },
        create: e,
        update: {},
      })
    )
  );
}

export async function remove(id: number) {
  return prisma.dutyRecord.delete({ where: { id } });
}

export async function getByWeek(weekId: number) {
  return prisma.dutyRecord.findMany({
    where: { game: { weekId } },
    include: { game: true, playerSeason: { include: { player: true, teamSeason: { include: { team: true } } } } },
  });
}
