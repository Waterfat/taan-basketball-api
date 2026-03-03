import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { CreateAnnouncementSchema, UpdateAnnouncementSchema } from '../../schemas/index.js';
import * as svc from '../../services/announcement.service.js';

export default async function announcementRoutes(fastify: FastifyInstance) {
  fastify.get('/announcements', async () => ok(await svc.list()));

  fastify.get('/announcements/:id', async (request) => {
    const { id } = request.params as { id: string };
    const item = await svc.getById(+id);
    if (!item) throw new NotFoundError('Announcement');
    return ok(item);
  });

  fastify.post('/announcements', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const data = CreateAnnouncementSchema.parse(request.body);
    return ok(await svc.create({ ...data, authorId: request.user.userId }));
  });

  fastify.patch('/announcements/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateAnnouncementSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });

  fastify.delete('/announcements/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });
}
