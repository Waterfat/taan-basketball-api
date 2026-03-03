import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import * as svc from '../../services/game.service.js';

export default async function gameRoutes(fastify: FastifyInstance) {
  fastify.get('/games', async (request) => {
    const { weekId, seasonId, status } = request.query as { weekId?: string; seasonId?: string; status?: string };
    const data = await svc.list({ weekId: weekId ? +weekId : undefined, seasonId: seasonId ? +seasonId : undefined, status: status as any });
    return { success: true, data };
  });

  fastify.get('/games/:id', async (request) => {
    const { id } = request.params as { id: string };
    const game = await svc.getById(+id);
    if (!game) throw new NotFoundError('Game');
    return { success: true, data: game };
  });

  fastify.patch('/games/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });
}
