import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';
import prisma from '../../src/prisma.js';

afterAll(async () => { await closeApp(); });

describe('Admin Weeks CRUD', () => {
  let seasonId: number;
  let createdWeekId: number;
  const testWeekNum = 9900 + Math.floor(Math.random() * 99);

  // Clean up leftover test weeks from previous runs
  beforeAll(async () => {
    await prisma.week.deleteMany({ where: { weekNum: { gte: 9900 } } });
  });

  it('GET /api/admin/seasons → find a season for testing', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/seasons' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThan(0);
    seasonId = body.data[0].id;
  });

  it('GET /api/admin/weeks?seasonId=X → list', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/weeks?seasonId=${seasonId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/admin/weeks → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/weeks',
      payload: {
        seasonId,
        weekNum: testWeekNum,
        date: '2026-12-31',
        phase: 'REGULAR',
        venue: '測試',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.weekNum).toBe(testWeekNum);
    createdWeekId = body.data.id;
  });

  it('GET /api/admin/weeks/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/weeks/${createdWeekId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdWeekId);
  });

  it('PATCH /api/admin/weeks/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/weeks/${createdWeekId}`,
      payload: { venue: '更新場地' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/admin/weeks without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: `/api/admin/weeks?seasonId=${seasonId}` });
    expect(res.statusCode).toBe(401);
  });
});
