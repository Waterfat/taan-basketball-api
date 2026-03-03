import type { FastifyInstance } from 'fastify';
import prisma from '../prisma.js';
import * as authService from '../services/auth.service.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };
    const user = await authService.verifyCredentials(username, password);
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const accessToken = fastify.jwt.sign({ userId: user.id, role: user.role });
    const refreshToken = await authService.createRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    };
  });

  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    const result = await authService.rotateRefreshToken(refreshToken);
    if (!result) return reply.status(401).send({ error: 'Invalid refresh token' });

    const accessToken = fastify.jwt.sign({ userId: result.user.id, role: result.user.role });
    return { accessToken, refreshToken: result.newToken };
  });

  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request) => {
    const { refreshToken } = request.body as { refreshToken: string };
    await authService.revokeRefreshToken(refreshToken);
    return { success: true };
  });

  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, username: true, displayName: true, role: true, email: true, playerId: true },
    });
    return { success: true, data: user };
  });
}
