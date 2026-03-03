import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding...');

  // Create SUPER_ADMIN
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', passwordHash, displayName: '管理員', role: 'SUPER_ADMIN' },
    update: { passwordHash, role: 'SUPER_ADMIN' },
  });
  console.log('  Created admin user (admin / admin123)');

  // Create 6 teams
  const teams = [
    { code: 'red', name: '紅隊', shortName: '紅', color: '#e53935', barColor: '#e53935', textColor: '#ffffff' },
    { code: 'black', name: '黑隊', shortName: '黑', color: '#212121', barColor: '#212121', textColor: '#ffffff' },
    { code: 'blue', name: '藍隊', shortName: '藍', color: '#1e88e5', barColor: '#1e88e5', textColor: '#ffffff' },
    { code: 'green', name: '綠隊', shortName: '綠', color: '#43a047', barColor: '#43a047', textColor: '#ffffff' },
    { code: 'yellow', name: '黃隊', shortName: '黃', color: '#fdd835', barColor: '#fdd835', textColor: '#000000' },
    { code: 'white', name: '白隊', shortName: '白', color: '#f5f5f5', barColor: '#bdbdbd', textColor: '#000000' },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { code: t.code },
      create: t,
      update: t,
    });
  }
  console.log('  Created 6 teams');

  // Create Season 25
  const season = await prisma.season.upsert({
    where: { number: 25 },
    create: { number: 25, name: '第 25 屆', isCurrent: true, startDate: new Date('2026-01-10') },
    update: { isCurrent: true },
  });
  console.log('  Created season 25');

  // Create TeamSeasons
  const allTeams = await prisma.team.findMany();
  for (const team of allTeams) {
    await prisma.teamSeason.upsert({
      where: { teamId_seasonId: { teamId: team.id, seasonId: season.id } },
      create: { teamId: team.id, seasonId: season.id },
      update: {},
    });
  }
  console.log('  Created team-seasons');

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
