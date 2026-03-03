import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { SaveStatsSchema, UpdateStatSchema } from '../../schemas/index.js';
import * as svc from '../../services/boxscore.service.js';

export default async function boxscoreRoutes(fastify: FastifyInstance) {
  fastify.get('/games/:gameId/boxscore', async (request) => {
    const { gameId } = request.params as { gameId: string };
    return ok(await svc.getByGame(+gameId));
  });

  fastify.post('/games/:gameId/boxscore', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { gameId } = request.params as { gameId: string };
    const { stats } = SaveStatsSchema.parse(request.body);
    return ok(await svc.batchUpsert(+gameId, stats));
  });

  fastify.patch('/boxscore/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateStatSchema.parse(request.body);
    const result = await svc.updateStat(+id, data);
    if (!result) throw new NotFoundError('Stat');
    return ok(result);
  });
}
