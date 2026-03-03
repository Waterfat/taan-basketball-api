import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { CreateTeamSchema, UpdateTeamSchema } from '../../schemas/index.js';
import * as svc from '../../services/team.service.js';

export default async function teamRoutes(fastify: FastifyInstance) {
  fastify.get('/teams', async () => ok(await svc.list()));

  fastify.get('/teams/:id', async (request) => {
    const { id } = request.params as { id: string };
    const team = await svc.getById(+id);
    if (!team) throw new NotFoundError('Team');
    return ok(team);
  });

  fastify.post('/teams', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const data = CreateTeamSchema.parse(request.body);
    return ok(await svc.create(data));
  });

  fastify.patch('/teams/:id', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateTeamSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });

  fastify.post('/teams/:teamId/seasons/:seasonId', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const { teamId, seasonId } = request.params as { teamId: string; seasonId: string };
    return ok(await svc.ensureTeamSeason(+teamId, +seasonId));
  });
}
