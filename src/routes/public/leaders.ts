import type { FastifyInstance } from 'fastify';
import * as leadersSvc from '../../services/leaders.service.js';
import { getCurrentSeason } from '../../utils/season.js';

export default async function leadersRoute(fastify: FastifyInstance) {
  fastify.get('/leaders', async () => {
    const season = await getCurrentSeason();
    if (!season) return { leaders: { headers: [], rows: [] }, offense: { headers: [], rows: [] }, defense: { headers: [], rows: [] }, net: { headers: [], rows: [] } };

    const data = await leadersSvc.getBySeason(season.id);

    // Transform to leaders table format
    const leadersHeaders = ['排名', '球員', '隊伍', 'PPG', 'RPG', 'APG', 'SPG', 'BPG', 'EFF'];
    const leadersRows = data.scoring.slice(0, 20).map((p, i) => {
      const reb = data.rebound.find((r) => r.name === p.name);
      const ast = data.assist.find((a) => a.name === p.name);
      const stl = data.steal.find((s) => s.name === p.name);
      const blk = data.block.find((b) => b.name === p.name);
      const eff = data.eff.find((e) => e.name === p.name);
      return [i + 1, p.name, p.team, p.val, reb?.val ?? 0, ast?.val ?? 0, stl?.val ?? 0, blk?.val ?? 0, eff?.val ?? 0];
    });

    return {
      leaders: { headers: leadersHeaders, rows: leadersRows },
      offense: { headers: [], rows: [] },
      defense: { headers: [], rows: [] },
      net: { headers: [], rows: [] },
    };
  });
}
