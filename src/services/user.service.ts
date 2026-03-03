import bcrypt from 'bcrypt';
import prisma from '../prisma.js';
import type { Role } from '@prisma/client';

export async function list() {
  return prisma.user.findMany({
    select: { id: true, username: true, displayName: true, role: true, email: true, playerId: true, lastLoginAt: true, createdAt: true },
    orderBy: { id: 'asc' },
  });
}

export async function getById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, displayName: true, role: true, email: true, playerId: true, lastLoginAt: true, createdAt: true },
  });
}

export async function create(data: { username: string; password: string; displayName: string; role?: Role; email?: string; playerId?: number }) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { username: data.username, passwordHash, displayName: data.displayName, role: data.role ?? 'VIEWER', email: data.email, playerId: data.playerId },
    select: { id: true, username: true, displayName: true, role: true },
  });
}

export async function update(id: number, data: Partial<{ displayName: string; role: Role; email: string; playerId: number; password: string }>) {
  const { password, ...rest } = data;
  const updateData: Omit<typeof rest, 'password'> & { passwordHash?: string } = { ...rest };
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, displayName: true, role: true },
  });
}

export async function remove(id: number) {
  return prisma.user.delete({ where: { id } });
}
