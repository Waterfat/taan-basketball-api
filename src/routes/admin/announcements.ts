import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/announcement.service.js';

export default async function announcementRoutes(fastify: FastifyInstance) {
  fastify.get('/announcements', async () => ({ success: true, data: await svc.list() }));

  fastify.get('/announcements/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await svc.getById(+id);
    if (!item) return reply.status(404).send({ error: 'Announcement not found' });
    return { success: true, data: item };
  });

  fastify.post('/announcements', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const data = request.body as any;
    data.authorId = request.user.userId;
    return { success: true, data: await svc.create(data) };
  });

  fastify.patch('/announcements/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });

  fastify.delete('/announcements/:id', { preHandler: [requireMinRole('ADMIN')] }, async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });
}
