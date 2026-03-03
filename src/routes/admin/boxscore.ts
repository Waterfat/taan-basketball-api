import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import * as svc from '../../services/boxscore.service.js';

export default async function boxscoreRoutes(fastify: FastifyInstance) {
  fastify.get('/games/:gameId/boxscore', async (request) => {
    const { gameId } = request.params as { gameId: string };
    return { success: true, data: await svc.getByGame(+gameId) };
  });

  fastify.post('/games/:gameId/boxscore', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { gameId } = request.params as { gameId: string };
    const { stats } = request.body as { stats: any[] };
    return { success: true, data: await svc.batchUpsert(+gameId, stats) };
  });

  fastify.patch('/boxscore/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const result = await svc.updateStat(+id, request.body as any);
    if (!result) throw new NotFoundError('Stat');
    return { success: true, data: result };
  });
}
