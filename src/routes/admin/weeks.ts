import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { CreateWeekSchema, UpdateWeekSchema, GenerateGamesSchema } from '../../schemas/index.js';
import * as svc from '../../services/week.service.js';

export default async function weekRoutes(fastify: FastifyInstance) {
  fastify.get('/weeks', async (request) => {
    const { seasonId } = request.query as { seasonId: string };
    return ok(await svc.list(+seasonId));
  });

  fastify.get('/weeks/:id', async (request) => {
    const { id } = request.params as { id: string };
    const week = await svc.getById(+id);
    if (!week) throw new NotFoundError('Week');
    return ok(week);
  });

  fastify.post('/weeks', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const data = CreateWeekSchema.parse(request.body);
    return ok(await svc.create(data));
  });

  fastify.patch('/weeks/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateWeekSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });

  fastify.post('/weeks/:id/games', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const { matchups } = GenerateGamesSchema.parse(request.body);
    return ok(await svc.generateGames(+id, matchups));
  });
}
