import type { FastifyInstance } from 'fastify';
import type { GameStatus } from '@prisma/client';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { UpdateGameSchema } from '../../schemas/index.js';
import * as svc from '../../services/game.service.js';

const VALID_GAME_STATUSES = new Set<string>(['UPCOMING', 'LIVE', 'FINISHED']);

export default async function gameRoutes(fastify: FastifyInstance) {
  fastify.get('/games', async (request) => {
    const { weekId, seasonId, status } = request.query as { weekId?: string; seasonId?: string; status?: string };
    const validStatus = status && VALID_GAME_STATUSES.has(status) ? (status as GameStatus) : undefined;
    const data = await svc.list({ weekId: weekId ? +weekId : undefined, seasonId: seasonId ? +seasonId : undefined, status: validStatus });
    return ok(data);
  });

  fastify.get('/games/:id', async (request) => {
    const { id } = request.params as { id: string };
    const game = await svc.getById(+id);
    if (!game) throw new NotFoundError('Game');
    return ok(game);
  });

  fastify.patch('/games/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateGameSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });
}
