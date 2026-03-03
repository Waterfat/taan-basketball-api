/**
 * 從前端 data/*.json 匯入資料到 PostgreSQL
 * 用法: npx tsx scripts/migrate-from-json.ts
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.resolve(import.meta.dirname!, '../../taan_basketball_league/data');
const MOCK_FILE = path.resolve(import.meta.dirname!, '../../taan_basketball_league/js/mock-data.js');

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
}

function readMockData(): any {
  const src = fs.readFileSync(MOCK_FILE, 'utf-8');
  // Extract the MOCK_DATA object by wrapping in a function
  const fn = new Function(`${src}; return MOCK_DATA;`);
  return fn();
}

const PHASE_MAP: Record<string, 'PRESEASON' | 'REGULAR' | 'PLAYOFF'> = {
  '熱身賽': 'PRESEASON', '例行賽': 'REGULAR', '季後賽': 'PLAYOFF',
};

const TEAM_CODE: Record<string, string> = {
  '紅': 'red', '黑': 'black', '藍': 'blue', '綠': 'green', '黃': 'yellow', '白': 'white',
};

const ATT_MAP: Record<string | number, 'PRESENT' | 'ABSENT' | 'AWOL' | 'UNKNOWN'> = {
  1: 'PRESENT', 0: 'ABSENT', 'x': 'AWOL', '?': 'UNKNOWN',
};

async function main() {
  console.log('Starting migration from JSON...');
  console.log(`Data dir: ${DATA_DIR}`);

  // 1. Ensure season + teams exist (from seed)
  const season = await prisma.season.findFirst({ where: { number: 25 } });
  if (!season) throw new Error('Season 25 not found. Run seed first.');

  const teamSeasons = await prisma.teamSeason.findMany({
    where: { seasonId: season.id },
    include: { team: true },
  });
  const tsMap = new Map(teamSeasons.map((ts) => [ts.team.shortName, ts]));

  // Load mock data (more complete than static JSON)
  const mock = readMockData();

  // 2. Import players from roster (mock has same format)
  console.log('\n--- Importing players ---');
  const roster = mock.roster;
  const playerMap = new Map<string, number>(); // name -> playerSeasonId

  for (const teamData of roster.teams) {
    const ts = tsMap.get(teamData.name.replace('隊', ''));
    if (!ts) { console.warn(`  Team not found: ${teamData.name}`); continue; }

    for (const p of teamData.players) {
      const player = await prisma.player.upsert({
        where: { id: 0 }, // force create since no unique on name
        create: { name: p.name },
        update: {},
      }).catch(() =>
        prisma.player.create({ data: { name: p.name } })
      );

      const ps = await prisma.playerSeason.upsert({
        where: { playerId_teamSeasonId: { playerId: player.id, teamSeasonId: ts.id } },
        create: { playerId: player.id, teamSeasonId: ts.id },
        update: {},
      });

      playerMap.set(p.name, ps.id);
    }
  }
  console.log(`  Created ${playerMap.size} players`);

  // 3. Import schedule from mock data (has all weeks)
  console.log('\n--- Importing schedule ---');
  const schedule = mock.schedule;
  const weekMap = new Map<number, number>(); // weekNum -> weekId

  for (const wk of schedule.allWeeks) {
    const [y, m, d] = wk.date.split('/').map(Number);

    if (wk.type === 'suspended') {
      const week = await prisma.week.upsert({
        where: { seasonId_weekNum: { seasonId: season.id, weekNum: -1 * (y * 10000 + m * 100 + d) } }, // unique key for suspended
        create: {
          seasonId: season.id,
          weekNum: -1 * (m * 100 + d), // negative for suspended
          date: new Date(y, m - 1, d),
          phase: 'REGULAR',
          venue: wk.venue ?? '',
          type: 'SUSPENDED',
          reason: wk.reason ?? '',
        },
        update: {},
      });
      console.log(`  Suspended: ${wk.date} - ${wk.reason}`);
      continue;
    }

    const week = await prisma.week.upsert({
      where: { seasonId_weekNum: { seasonId: season.id, weekNum: wk.week } },
      create: {
        seasonId: season.id,
        weekNum: wk.week,
        date: new Date(y, m - 1, d),
        phase: PHASE_MAP[wk.phase] ?? 'REGULAR',
        venue: wk.venue ?? '',
        type: 'GAME',
      },
      update: { date: new Date(y, m - 1, d), phase: PHASE_MAP[wk.phase] ?? 'REGULAR', venue: wk.venue ?? '' },
    });
    weekMap.set(wk.week, week.id);

    // Create games from matchups
    if (wk.matchups) {
      for (const m of wk.matchups) {
        const homeTs = tsMap.get(m.home);
        const awayTs = tsMap.get(m.away);
        if (!homeTs || !awayTs) { console.warn(`  Team not found: ${m.home} or ${m.away}`); continue; }

        const status = m.status === 'finished' ? 'FINISHED' : m.status === 'live' ? 'LIVE' : 'UPCOMING';

        await prisma.game.upsert({
          where: { weekId_gameNum: { weekId: week.id, gameNum: m.combo } },
          create: {
            weekId: week.id,
            gameNum: m.combo,
            homeTeamId: homeTs.id,
            awayTeamId: awayTs.id,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status,
          },
          update: { homeScore: m.homeScore, awayScore: m.awayScore, status },
        });
      }
    }
    console.log(`  Week ${wk.week}: ${wk.matchups?.length ?? 0} games`);
  }

  // 4. Import attendance
  console.log('\n--- Importing attendance ---');
  let attCount = 0;
  for (const teamData of roster.teams) {
    for (const p of teamData.players) {
      const psId = playerMap.get(p.name);
      if (!psId) continue;

      for (let i = 0; i < p.att.length; i++) {
        const wkNum = roster.weeks[i]?.wk;
        if (!wkNum) continue;
        const weekId = weekMap.get(wkNum);
        if (!weekId) continue;

        const status = ATT_MAP[p.att[i]] ?? 'UNKNOWN';
        await prisma.attendance.upsert({
          where: { weekId_playerSeasonId: { weekId, playerSeasonId: psId } },
          create: { weekId, playerSeasonId: psId, status },
          update: { status },
        });
        attCount++;
      }
    }
  }
  console.log(`  Created ${attCount} attendance records`);

  // 5. Import dragon scores from mock
  console.log('\n--- Importing dragon scores ---');
  const dragon = mock.dragon;
  let dragonCount = 0;
  for (const d of dragon.players) {
    const psId = playerMap.get(d.name);
    if (!psId) { console.warn(`  Dragon: player not found: ${d.name}`); continue; }

    await prisma.dragonScore.upsert({
      where: { seasonId_playerSeasonId: { seasonId: season.id, playerSeasonId: psId } },
      create: {
        seasonId: season.id,
        playerSeasonId: psId,
        attPoints: d.att ?? 0,
        dutyPoints: d.duty ?? 0,
        mopPoints: d.mop ?? 0,
        playoffPoints: d.playoff,
        totalPoints: d.total ?? 0,
      },
      update: {
        attPoints: d.att ?? 0,
        dutyPoints: d.duty ?? 0,
        mopPoints: d.mop ?? 0,
        playoffPoints: d.playoff,
        totalPoints: d.total ?? 0,
      },
    });
    dragonCount++;
  }
  console.log(`  Created ${dragonCount} dragon scores`);

  // 6. Recalculate standings
  console.log('\n--- Recalculating standings ---');
  const games = await prisma.game.findMany({
    where: { week: { seasonId: season.id }, status: 'FINISHED' },
  });

  const stats = new Map<number, { wins: number; losses: number; results: ('W' | 'L')[] }>();
  for (const g of games) {
    if (g.homeScore == null || g.awayScore == null) continue;
    const homeWin = g.homeScore > g.awayScore;
    for (const [tsId, won] of [[g.homeTeamId, homeWin], [g.awayTeamId, !homeWin]] as [number, boolean][]) {
      const s = stats.get(tsId) ?? { wins: 0, losses: 0, results: [] };
      if (won) s.wins++; else s.losses++;
      s.results.push(won ? 'W' : 'L');
      stats.set(tsId, s);
    }
  }

  await prisma.standing.deleteMany({ where: { seasonId: season.id } });
  const entries = [...stats.entries()]
    .map(([tsId, s]) => ({
      teamSeasonId: tsId,
      wins: s.wins, losses: s.losses,
      pct: s.wins / (s.wins + s.losses),
      streak: calcStreak(s.results),
    }))
    .sort((a, b) => b.pct - a.pct || b.wins - a.wins);

  for (let i = 0; i < entries.length; i++) {
    await prisma.standing.create({
      data: { seasonId: season.id, ...entries[i], rank: i + 1 },
    });
  }
  console.log(`  Created ${entries.length} standings`);

  console.log('\n✅ Migration complete!');
}

function calcStreak(results: ('W' | 'L')[]): number {
  if (results.length === 0) return 0;
  const last = results[results.length - 1];
  let count = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) count++;
  return last === 'W' ? count : -count;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
