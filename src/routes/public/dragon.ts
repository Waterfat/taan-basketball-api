import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

export default async function dragonRoute(fastify: FastifyInstance) {
  fastify.get('/dragon', async () => {
    const season = await prisma.season.findFirst({ where: { isCurrent: true } });
    if (!season) return { season: 0, phase: '', civilianThreshold: 36, columns: [], players: [] };

    const scores = await prisma.dragonScore.findMany({
      where: { seasonId: season.id },
      include: {
        playerSeason: {
          include: {
            player: true,
            teamSeason: { include: { team: true } },
          },
        },
      },
      orderBy: { totalPoints: 'desc' },
    });

    const players = scores.map((d, i) => ({
      rank: i + 1,
      name: d.playerSeason.player.name,
      team: d.playerSeason.teamSeason.team.shortName,
      tag: d.playerSeason.player.isReferee ? '裁' : null,
      att: d.attPoints,
      duty: d.dutyPoints,
      mop: d.mopPoints,
      playoff: d.playoffPoints,
      total: d.totalPoints,
    }));

    return {
      season: season.number,
      phase: '賽季進行中',
      civilianThreshold: 36,
      columns: ['出席', '輪值', '拖地', '季後賽'],
      players,
    };
  });
}
