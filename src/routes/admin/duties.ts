import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/duty.service.js';

export default async function dutyRoutes(fastify: FastifyInstance) {
  fastify.get('/duties', async (request) => {
    const { gameId, weekId } = request.query as { gameId?: string; weekId?: string };
    if (gameId) return { success: true, data: await svc.getByGame(+gameId) };
    if (weekId) return { success: true, data: await svc.getByWeek(+weekId) };
    return { success: false, error: 'gameId or weekId required' };
  });

  fastify.post('/duties/batch', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { entries } = request.body as { entries: any[] };
    return { success: true, data: await svc.batchAssign(entries) };
  });

  fastify.delete('/duties/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });
}
