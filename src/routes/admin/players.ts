import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/player.service.js';

export default async function playerRoutes(fastify: FastifyInstance) {
  fastify.get('/players', async (request) => {
    const { teamId, seasonId, search } = request.query as { teamId?: string; seasonId?: string; search?: string };
    const data = await svc.list({ teamId: teamId ? +teamId : undefined, seasonId: seasonId ? +seasonId : undefined, search });
    return { success: true, data };
  });

  fastify.get('/players/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const player = await svc.getById(+id);
    if (!player) return reply.status(404).send({ error: 'Player not found' });
    return { success: true, data: player };
  });

  fastify.post('/players', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    return { success: true, data: await svc.create(request.body as any) };
  });

  fastify.patch('/players/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });

  fastify.delete('/players/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });

  fastify.post('/players/:id/assign-team', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const { teamSeasonId, jerseyNumber, isCaptain } = request.body as any;
    return { success: true, data: await svc.assignTeam(+id, teamSeasonId, { jerseyNumber, isCaptain }) };
  });
}
