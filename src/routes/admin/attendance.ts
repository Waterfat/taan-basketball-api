import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { AppError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { SaveAttendanceSchema } from '../../schemas/index.js';
import * as svc from '../../services/attendance.service.js';

export default async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.get('/attendance', async (request) => {
    const { weekId, seasonId } = request.query as { weekId?: string; seasonId?: string };
    if (weekId) return ok(await svc.getByWeek(+weekId));
    if (seasonId) return ok(await svc.getBySeason(+seasonId));
    throw new AppError(400, 'weekId or seasonId required');
  });

  fastify.post('/attendance/batch', { preHandler: [requireMinRole('TEAM_CAPTAIN')] }, async (request) => {
    const { entries } = SaveAttendanceSchema.parse(request.body);
    return ok(await svc.batchUpsert(entries));
  });
}
