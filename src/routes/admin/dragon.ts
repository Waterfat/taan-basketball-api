import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { RecalculateDragonSchema, UpdateDragonSchema } from '../../schemas/index.js';
import * as svc from '../../services/dragon.service.js';

export default async function dragonRoutes(fastify: FastifyInstance) {
  fastify.get('/dragon', async (request) => {
    const { seasonId } = request.query as { seasonId: string };
    return ok(await svc.getBySeason(+seasonId));
  });

  fastify.post('/dragon/recalculate', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { seasonId } = RecalculateDragonSchema.parse(request.body);
    return ok(await svc.recalculate(seasonId));
  });

  fastify.patch('/dragon/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateDragonSchema.parse(request.body);
    const result = await svc.manualAdjust(+id, data);
    if (!result) throw new NotFoundError('DragonScore');
    return ok(result);
  });
}
