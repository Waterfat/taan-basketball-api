import prisma from '../prisma.js';

export async function list(filters?: { teamId?: number; seasonId?: number; search?: string }) {
  const where: any = {};
  if (filters?.search) where.name = { contains: filters.search };
  if (filters?.teamId || filters?.seasonId) {
    where.playerSeasons = { some: {} };
    if (filters.teamId) where.playerSeasons.some.teamSeason = { teamId: filters.teamId };
    if (filters.seasonId) where.playerSeasons.some.teamSeason = { ...where.playerSeasons.some.teamSeason, seasonId: filters.seasonId };
  }
  return prisma.player.findMany({
    where,
    include: { playerSeasons: { include: { teamSeason: { include: { team: true, season: true } } } } },
    orderBy: { name: 'asc' },
  });
}

export async function getById(id: number) {
  return prisma.player.findUnique({
    where: { id },
    include: { playerSeasons: { include: { teamSeason: { include: { team: true, season: true } } } } },
  });
}

export async function create(data: { name: string; avatarUrl?: string; phone?: string; isReferee?: boolean }) {
  return prisma.player.create({ data });
}

export async function update(id: number, data: Partial<{ name: string; avatarUrl: string; phone: string; isReferee: boolean }>) {
  return prisma.player.update({ where: { id }, data });
}

export async function remove(id: number) {
  return prisma.player.delete({ where: { id } });
}

export async function assignTeam(playerId: number, teamSeasonId: number, opts?: { jerseyNumber?: number; isCaptain?: boolean }) {
  return prisma.playerSeason.upsert({
    where: { playerId_teamSeasonId: { playerId, teamSeasonId } },
    create: { playerId, teamSeasonId, jerseyNumber: opts?.jerseyNumber, isCaptain: opts?.isCaptain ?? false },
    update: { jerseyNumber: opts?.jerseyNumber, isCaptain: opts?.isCaptain },
  });
}
