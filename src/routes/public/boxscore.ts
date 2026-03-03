import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { PHASE_MAP } from '../../utils/constants.js';

export default async function boxscoreRoute(fastify: FastifyInstance) {
  fastify.get('/boxscore', async () => {
    const season = await prisma.season.findFirst({ where: { isCurrent: true } });
    if (!season) return { season: 0, defaultIdx: 0, weeks: [] };

    const weeks = await prisma.week.findMany({
      where: { seasonId: season.id, type: 'GAME' },
      include: {
        games: {
          include: {
            homeTeam: { include: { team: true } },
            awayTeam: { include: { team: true } },
            playerStats: { include: { playerSeason: { include: { player: true } } } },
          },
          orderBy: { gameNum: 'asc' },
        },
      },
      orderBy: { weekNum: 'asc' },
    });

    let defaultIdx = 0;
    const result = weeks
      .filter((w) => w.games.some((g) => g.status === 'FINISHED'))
      .map((w, i) => {
        defaultIdx = i;
        return {
          phase: PHASE_MAP[w.phase] ?? w.phase,
          weekNum: w.weekNum,
          games: w.games.filter((g) => g.status === 'FINISHED').map((g) => {
            const homeStats = g.playerStats.filter((s) => s.isHome);
            const awayStats = g.playerStats.filter((s) => !s.isHome);
            const sum = (arr: typeof homeStats) => arr.reduce(
              (acc, s) => {
                for (const k of ['fg2Miss', 'fg2Made', 'fg3Miss', 'fg3Made', 'ftMiss', 'ftMade', 'pts', 'oreb', 'dreb', 'treb', 'ast', 'blk', 'stl', 'tov', 'pf'] as const)
                  (acc as any)[k] += s[k];
                return acc;
              },
              { fg2Miss: 0, fg2Made: 0, fg3Miss: 0, fg3Made: 0, ftMiss: 0, ftMade: 0, pts: 0, oreb: 0, dreb: 0, treb: 0, ast: 0, blk: 0, stl: 0, tov: 0, pf: 0 }
            );

            const mapPlayer = (s: typeof homeStats[0]) => ({
              name: s.playerSeason.player.name,
              team: g.homeTeam.team.shortName,
              played: s.played,
              fg2Miss: s.fg2Miss, fg2Made: s.fg2Made,
              fg3Miss: s.fg3Miss, fg3Made: s.fg3Made,
              ftMiss: s.ftMiss, ftMade: s.ftMade,
              pts: s.pts, oreb: s.oreb, dreb: s.dreb, treb: s.treb,
              ast: s.ast, blk: s.blk, stl: s.stl, tov: s.tov, pf: s.pf,
            });

            return {
              weekNum: w.weekNum, gameNum: g.gameNum, phase: PHASE_MAP[w.phase] ?? w.phase,
              homeTeam: g.homeTeam.team.shortName, awayTeam: g.awayTeam.team.shortName,
              homeScore: g.homeScore, awayScore: g.awayScore,
              recorder: g.recorder, hasScores: true, countsForStats: w.weekNum > 0 && g.gameNum > 0,
              homeTot: sum(homeStats), awayTot: sum(awayStats),
              homePlayers: homeStats.map(mapPlayer),
              awayPlayers: awayStats.map((s) => ({ ...mapPlayer(s), team: g.awayTeam.team.shortName })),
            };
          }),
        };
      });

    return { season: season.number, defaultIdx, weeks: result };
  });
}
