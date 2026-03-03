import type { FastifyInstance } from 'fastify';
import homeRoute from './home.js';
import scheduleRoute from './schedule.js';
import standingsRoute from './standings.js';
import boxscoreRoute from './boxscore.js';
import leadersRoute from './leaders.js';
import rosterRoute from './roster.js';
import dragonRoute from './dragon.js';
import statsRoute from './stats.js';
import rotationRoute from './rotation.js';

export default async function publicRoutes(fastify: FastifyInstance) {
  fastify.register(homeRoute);
  fastify.register(scheduleRoute);
  fastify.register(standingsRoute);
  fastify.register(boxscoreRoute);
  fastify.register(leadersRoute);
  fastify.register(rosterRoute);
  fastify.register(dragonRoute);
  fastify.register(statsRoute);
  fastify.register(rotationRoute);
}
