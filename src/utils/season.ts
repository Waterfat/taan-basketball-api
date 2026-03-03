import prisma from '../prisma.js';

export async function getCurrentSeason() {
  return prisma.season.findFirst({ where: { isCurrent: true } });
}
