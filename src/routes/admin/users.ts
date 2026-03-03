import type { FastifyInstance } from 'fastify';
import { requireMinRole } from '../../utils/rbac.js';
import { NotFoundError } from '../../utils/errors.js';
import { ok } from '../../utils/response.js';
import { CreateUserSchema, UpdateUserSchema } from '../../schemas/index.js';
import * as svc from '../../services/user.service.js';

export default async function userRoutes(fastify: FastifyInstance) {
  // All user management routes require SUPER_ADMIN
  fastify.addHook('onRequest', requireMinRole('SUPER_ADMIN'));

  fastify.get('/users', async () => ok(await svc.list()));

  fastify.get('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    const user = await svc.getById(+id);
    if (!user) throw new NotFoundError('User');
    return ok(user);
  });

  fastify.post('/users', async (request) => {
    const data = CreateUserSchema.parse(request.body);
    return ok(await svc.create(data));
  });

  fastify.patch('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = UpdateUserSchema.parse(request.body);
    return ok(await svc.update(+id, data));
  });

  fastify.delete('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    await svc.remove(+id);
    return ok({ deleted: true });
  });
}
