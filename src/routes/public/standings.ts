import type { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { PHASE_MAP } from '../../utils/constants.js';
import { getCurrentSeason } from '../../utils/season.js';

export default async function standingsRoute(fastify: FastifyInstance) {
  fastify.get('/standings', async () => {
    const season = await getCurrentSeason();
    if (!season) return { season: 0, phase: '', currentWeek: 0, teams: [], matrix: { teams: [], results: [] } };

    const teamSeasons = await prisma.teamSeason.findMany({
      where: { seasonId: season.id },
      include: { team: true },
    });
    const tsMap = new Map(teamSeasons.map((ts) => [ts.id, ts]));
    const teamOrder = teamSeasons.map((ts) => ts.team.shortName);

    // Standings
    const standings = await prisma.standing.findMany({
      where: { seasonId: season.id },
      orderBy: { rank: 'asc' },
    });

    // Games for history + matrix
    const games = await prisma.game.findMany({
      where: { week: { seasonId: season.id }, status: 'FINISHED' },
      include: { week: true },
      orderBy: [{ week: { weekNum: 'asc' } }, { gameNum: 'asc' }],
    });

    // Per-team game history (W/L per game in order)
    const teamHistory = new Map<number, string[]>();
    for (const g of games) {
      if (g.homeScore == null || g.awayScore == null) continue;
      const homeWin = g.homeScore > g.awayScore;
      (teamHistory.get(g.homeTeamId) ?? (() => { teamHistory.set(g.homeTeamId, []); return teamHistory.get(g.homeTeamId)!; })())
        .push(homeWin ? 'W' : 'L');
      (teamHistory.get(g.awayTeamId) ?? (() => { teamHistory.set(g.awayTeamId, []); return teamHistory.get(g.awayTeamId)!; })())
        .push(!homeWin ? 'W' : 'L');
    }

    // H2H matrix
    const h2h = new Map<string, number>();
    for (const g of games) {
      if (g.homeScore == null || g.awayScore == null) continue;
      const key = `${g.homeTeamId}-${g.awayTeamId}`;
      const reverseKey = `${g.awayTeamId}-${g.homeTeamId}`;
      const homeWin = g.homeScore > g.awayScore;
      h2h.set(key, (h2h.get(key) ?? 0) + (homeWin ? 1 : -1));
      h2h.set(reverseKey, (h2h.get(reverseKey) ?? 0) + (homeWin ? -1 : 1));
    }

    const latestWeek = await prisma.week.findFirst({
      where: { seasonId: season.id, type: 'GAME', games: { some: { status: 'FINISHED' } } },
      orderBy: { weekNum: 'desc' },
    });

    const teams = standings.map((s) => {
      const ts = tsMap.get(s.teamSeasonId);
      const team = ts?.team;
      const history = teamHistory.get(s.teamSeasonId) ?? [];
      const streakAbs = Math.abs(s.streak);
      const streakType = s.streak >= 0 ? 'win' : 'lose';
      return {
        rank: s.rank,
        name: `${team?.shortName ?? '?'}隊`,
        team: team?.shortName ?? '?',
        wins: s.wins,
        losses: s.losses,
        pct: `${(s.pct * 100).toFixed(1)}%`,
        history,
        streak: `${streakAbs}連${s.streak >= 0 ? '勝' : '敗'}`,
        streakType,
      };
    });

    // Build matrix
    const matrixResults = teamSeasons.map((ts1) =>
      teamSeasons.map((ts2) => {
        if (ts1.id === ts2.id) return null;
        const key = `${ts1.id}-${ts2.id}`;
        return h2h.get(key) ?? null;
      })
    );

    return {
      season: season.number,
      phase: latestWeek ? PHASE_MAP[latestWeek.phase] ?? latestWeek.phase : '',
      currentWeek: latestWeek?.weekNum ?? 0,
      teams,
      matrix: { teams: teamOrder, results: matrixResults },
    };
  });
}
