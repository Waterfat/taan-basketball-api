import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/dragon.service.js';

export default async function dragonRoutes(fastify: FastifyInstance) {
  fastify.get('/dragon', async (request) => {
    const { seasonId } = request.query as { seasonId: string };
    return { success: true, data: await svc.getBySeason(+seasonId) };
  });

  fastify.post('/dragon/recalculate', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { seasonId } = request.body as { seasonId: number };
    return { success: true, data: await svc.recalculate(seasonId) };
  });

  fastify.patch('/dragon/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await svc.manualAdjust(+id, request.body as any);
    if (!result) return reply.status(404).send({ error: 'DragonScore not found' });
    return { success: true, data: result };
  });
}
