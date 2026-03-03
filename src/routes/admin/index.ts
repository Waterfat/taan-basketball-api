import type { FastifyInstance } from 'fastify';
import seasonRoutes from './seasons.js';
import teamRoutes from './teams.js';
import playerRoutes from './players.js';
import weekRoutes from './weeks.js';
import gameRoutes from './games.js';
import boxscoreRoutes from './boxscore.js';
import attendanceRoutes from './attendance.js';
import dutyRoutes from './duties.js';
import dragonRoutes from './dragon.js';
import announcementRoutes from './announcements.js';
import userRoutes from './users.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.register(seasonRoutes);
  fastify.register(teamRoutes);
  fastify.register(playerRoutes);
  fastify.register(weekRoutes);
  fastify.register(gameRoutes);
  fastify.register(boxscoreRoutes);
  fastify.register(attendanceRoutes);
  fastify.register(dutyRoutes);
  fastify.register(dragonRoutes);
  fastify.register(announcementRoutes);
  fastify.register(userRoutes);
}
