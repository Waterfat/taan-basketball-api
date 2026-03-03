import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@prisma/client';

const ROLE_LEVEL: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  TEAM_CAPTAIN: 3,
  PLAYER: 2,
  VIEWER: 1,
};

export function requireMinRole(minRole: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userLevel = ROLE_LEVEL[request.user.role] || 0;
    const requiredLevel = ROLE_LEVEL[minRole] || 0;
    if (userLevel < requiredLevel) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}
