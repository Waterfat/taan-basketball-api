import prisma from '../prisma.js';

export async function list() {
  return prisma.season.findMany({ orderBy: { number: 'desc' } });
}

export async function getById(id: number) {
  return prisma.season.findUnique({ where: { id }, include: { teamSeasons: { include: { team: true } } } });
}

export async function create(data: { number: number; name?: string; startDate?: string; endDate?: string; isCurrent?: boolean }) {
  return prisma.$transaction(async (tx) => {
    if (data.isCurrent) await tx.season.updateMany({ data: { isCurrent: false } });
    return tx.season.create({
      data: {
        number: data.number,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isCurrent: data.isCurrent ?? false,
      },
    });
  });
}

export async function update(id: number, data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean }) {
  return prisma.$transaction(async (tx) => {
    if (data.isCurrent) await tx.season.updateMany({ data: { isCurrent: false } });
    return tx.season.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isCurrent: data.isCurrent,
      },
    });
  });
}

export async function getCurrent() {
  return prisma.season.findFirst({ where: { isCurrent: true }, include: { teamSeasons: { include: { team: true } } } });
}
