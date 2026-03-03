import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { CreatePlayerSchema, UpdatePlayerSchema, AssignTeamSchema } from '../../schemas/index.js';
import * as svc from '../../services/player.service.js';

export default async function playerRoutes(fastify: FastifyInstance) {
  fastify.get('/players', async (request) => {
    const { teamId, seasonId, search } = request.query as { teamId?: string; seasonId?: string; search?: string };
    const data = await svc.list({ teamId: teamId ? +teamId : undefined, seasonId: seasonId ? +seasonId : undefined, search });
    return ok(data);
  });

  fastify.get('/players/:id', async (request) => {
    const { id } = request.params as { id: string };
    const player = await svc.getById(+id);
    if (!player) throw new NotFoundError('Player');
    return ok(player);
  });

  fastify.post('/players', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const data = CreatePlayerSchema.parse(request.body);
    return ok(await svc.create(data));
  });

  fastify.patch('/players/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdatePlayerSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });

  fastify.delete('/players/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });

  fastify.post('/players/:id/assign-team', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const { teamSeasonId, jerseyNumber, isCaptain } = AssignTeamSchema.parse(request.body);
    return ok(await svc.assignTeam(+id, teamSeasonId, { jerseyNumber, isCaptain }));
  });
}
