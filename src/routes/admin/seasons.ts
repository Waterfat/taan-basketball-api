import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/season.service.js';

export default async function seasonRoutes(fastify: FastifyInstance) {
  fastify.get('/seasons', async () => ({ success: true, data: await svc.list() }));

  fastify.get('/seasons/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const season = await svc.getById(+id);
    if (!season) return reply.status(404).send({ error: 'Season not found' });
    return { success: true, data: season };
  });

  fastify.post('/seasons', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const data = request.body as any;
    return { success: true, data: await svc.create(data) };
  });

  fastify.patch('/seasons/:id', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });
}
