import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/attendance.service.js';

export default async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.get('/attendance', async (request) => {
    const { weekId, seasonId } = request.query as { weekId?: string; seasonId?: string };
    if (weekId) return { success: true, data: await svc.getByWeek(+weekId) };
    if (seasonId) return { success: true, data: await svc.getBySeason(+seasonId) };
    return { success: false, error: 'weekId or seasonId required' };
  });

  fastify.post('/attendance/batch', { preHandler: [requireMinRole('TEAM_CAPTAIN')] }, async (request) => {
    const { entries } = request.body as { entries: any[] };
    return { success: true, data: await svc.batchUpsert(entries) };
  });
}
