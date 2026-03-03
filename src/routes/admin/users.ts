import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import * as svc from '../../services/user.service.js';

export default async function userRoutes(fastify: FastifyInstance) {
  // All user management routes require SUPER_ADMIN
  fastify.addHook('onRequest', requireMinRole('SUPER_ADMIN'));

  fastify.get('/users', async () => ({ success: true, data: await svc.list() }));

  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await svc.getById(+id);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return { success: true, data: user };
  });

  fastify.post('/users', async (request) => {
    return { success: true, data: await svc.create(request.body as any) };
  });

  fastify.patch('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await svc.update(+id, request.body as any) };
  });

  fastify.delete('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return { success: true };
  });
}
