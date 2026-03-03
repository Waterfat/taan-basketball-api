import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { AppError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { SaveDutiesSchema } from '../../schemas/index.js';
import * as svc from '../../services/duty.service.js';

export default async function dutyRoutes(fastify: FastifyInstance) {
  fastify.get('/duties', async (request) => {
    const { gameId, weekId } = request.query as { gameId?: string; weekId?: string };
    if (gameId) return ok(await svc.getByGame(+gameId));
    if (weekId) return ok(await svc.getByWeek(+weekId));
    throw new AppError(400, 'gameId or weekId required');
  });

  fastify.post('/duties/batch', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { entries } = SaveDutiesSchema.parse(request.body);
    return ok(await svc.batchAssign(entries));
  });

  fastify.delete('/duties/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return ok({ deleted: true });
  });
}
