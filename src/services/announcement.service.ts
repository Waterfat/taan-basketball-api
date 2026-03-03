import prisma from '../prisma.js';

export async function list() {
  return prisma.announcement.findMany({ orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }] });
}

export async function getById(id: number) {
  return prisma.announcement.findUnique({ where: { id } });
}

export async function create(data: { title: string; content: string; authorId: number; isPinned?: boolean }) {
  return prisma.announcement.create({ data });
}

export async function update(id: number, data: Partial<{ title: string; content: string; isPinned: boolean }>) {
  return prisma.announcement.update({ where: { id }, data });
}

export async function remove(id: number) {
  return prisma.announcement.delete({ where: { id } });
}
