import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Seasons CRUD', () => {
  // Use a large random number to avoid conflicts with real data
  const testSeasonNumber = 99000 + Math.floor(Math.random() * 900);
  let createdSeasonId: number;

  it('GET /api/admin/seasons → list', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/seasons' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/admin/seasons → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/seasons',
      payload: { number: testSeasonNumber, name: `Test Season ${testSeasonNumber}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.number).toBe(testSeasonNumber);
    createdSeasonId = body.data.id;
  });

  it('GET /api/admin/seasons/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/seasons/${createdSeasonId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdSeasonId);
  });

  it('PATCH /api/admin/seasons/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/seasons/${createdSeasonId}`,
      payload: { name: `Updated Season ${testSeasonNumber}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(`Updated Season ${testSeasonNumber}`);
  });

  it('POST /api/admin/seasons with missing required fields → 400', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/seasons',
      payload: { name: 'No number field' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('GET /api/admin/seasons without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/seasons' });
    expect(res.statusCode).toBe(401);
  });
});
