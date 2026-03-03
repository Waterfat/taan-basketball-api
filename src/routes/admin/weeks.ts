import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/week.service.js';

export default async function weekRoutes(fastify: FastifyInstance) {
  fastify.get('/weeks', async (request) => {
    const { seasonId } = request.query as { seasonId: string };
    return { success: true, data: await svc.list(+seasonId) };
  });

  fastify.get('/weeks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const week = await svc.getById(+id);
    if (!week) return reply.status(404).send({ error: 'Week not found' });
    return { success: true, data: week };
  });

  fastify.post('/weeks', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    return { success: true, data: await svc.create(request.body as any) };
  });

  fastify.patch('/weeks/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });

  fastify.post('/weeks/:id/games', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const { matchups } = request.body as { matchups: any[] };
    return { success: true, data: await svc.generateGames(+id, matchups) };
  });
}
