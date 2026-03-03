import prisma from '../prisma.js';

export async function list() {
  return prisma.team.findMany({ orderBy: { id: 'asc' } });
}

export async function getById(id: number) {
  return prisma.team.findUnique({ where: { id } });
}

export async function create(data: { code: string; name: string; shortName: string; color: string; barColor?: string; textColor?: string }) {
  return prisma.team.create({ data });
}

export async function update(id: number, data: Partial<{ name: string; shortName: string; color: string; barColor: string; textColor: string }>) {
  return prisma.team.update({ where: { id }, data });
}

export async function ensureTeamSeason(teamId: number, seasonId: number) {
  return prisma.teamSeason.upsert({
    where: { teamId_seasonId: { teamId, seasonId } },
    create: { teamId, seasonId },
    update: {},
  });
}
