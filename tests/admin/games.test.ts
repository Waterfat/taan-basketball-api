import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Games CRUD', () => {
  it('GET /api/admin/games → list (no filter)', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/games' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/admin/games?seasonId=X → list with seasonId filter', async () => {
    // First find a season
    const seasonsRes = await adminInject({ method: 'GET', url: '/api/admin/seasons' });
    const seasonId = seasonsRes.json().data[0]?.id;
    if (!seasonId) return;

    const res = await adminInject({ method: 'GET', url: `/api/admin/games?seasonId=${seasonId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/admin/games?status=FINISHED → list with status filter', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/games?status=FINISHED' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('PATCH /api/admin/games/:id → update (if games exist)', async () => {
    // Get a game to update
    const listRes = await adminInject({ method: 'GET', url: '/api/admin/games' });
    const games = listRes.json().data;
    if (games.length === 0) return; // skip if no games

    const gameId = games[0].id;
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/games/${gameId}`,
      payload: { recorder: 'test_recorder' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/admin/games without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/games' });
    expect(res.statusCode).toBe(401);
  });
});
