import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Players CRUD', () => {
  let createdPlayerId: number;

  it('GET /api/admin/players → list', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/players' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/admin/players → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/players',
      payload: { name: `TestPlayer_${Date.now()}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toContain('TestPlayer_');
    createdPlayerId = body.data.id;
  });

  it('GET /api/admin/players/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/players/${createdPlayerId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdPlayerId);
  });

  it('PATCH /api/admin/players/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/players/${createdPlayerId}`,
      payload: { name: `UpdatedPlayer_${Date.now()}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toContain('UpdatedPlayer_');
  });

  it('GET /api/admin/players?search=TestPlayer → filter by search', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/players?search=UpdatedPlayer' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/admin/players with missing name → validation error', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/players',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('GET /api/admin/players without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/players' });
    expect(res.statusCode).toBe(401);
  });
});
