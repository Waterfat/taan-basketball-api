import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import * as svc from '../../services/team.service.js';

export default async function teamRoutes(fastify: FastifyInstance) {
  fastify.get('/teams', async () => ({ success: true, data: await svc.list() }));

  fastify.get('/teams/:id', async (request) => {
    const { id } = request.params as { id: string };
    const team = await svc.getById(+id);
    if (!team) throw new NotFoundError('Team');
    return { success: true, data: team };
  });

  fastify.post('/teams', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    return { success: true, data: await svc.create(request.body as any) };
  });

  fastify.patch('/teams/:id', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });

  fastify.post('/teams/:teamId/seasons/:seasonId', { preHandler: [requireMinRole('SUPER_ADMIN')] }, async (request) => {
    const { teamId, seasonId } = request.params as { teamId: string; seasonId: string };
    return { success: true, data: await svc.ensureTeamSeason(+teamId, +seasonId) };
  });
}
