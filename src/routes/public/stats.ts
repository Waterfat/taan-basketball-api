import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import * as leadersSvc from '../../services/leaders.service.js';

export default async function statsRoute(fastify: FastifyInstance) {
  fastify.get('/stats', async () => {
    const seasons = await prisma.season.findMany({ orderBy: { number: 'desc' } });
    const result: Record<string, any> = {};

    for (const season of seasons) {
      const data = await leadersSvc.getBySeason(season.id);
      result[String(season.number)] = {
        label: `第 ${season.number} 屆 · ${season.isCurrent ? '本季個人排行榜' : '歷史數據'}`,
        scoring: data.scoring.slice(0, 20),
        rebound: data.rebound.slice(0, 20),
        assist: data.assist.slice(0, 20),
        steal: data.steal.slice(0, 20),
        block: data.block.slice(0, 20),
        eff: data.eff.slice(0, 20),
      };
    }

    return result;
  });
}
