import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Teams CRUD', () => {
  let createdTeamId: number;

  it('GET /api/admin/teams → list', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/teams' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/admin/teams → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/teams',
      payload: {
        code: `test_${Date.now()}`,
        name: 'Test Team',
        shortName: '測',
        color: '#999999',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Test Team');
    createdTeamId = body.data.id;
  });

  it('GET /api/admin/teams/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/teams/${createdTeamId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdTeamId);
  });

  it('PATCH /api/admin/teams/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/teams/${createdTeamId}`,
      payload: { name: 'Updated Test Team' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated Test Team');
  });

  it('POST /api/admin/teams with empty body → validation error', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/teams',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('GET /api/admin/teams without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/teams' });
    expect(res.statusCode).toBe(401);
  });
});
