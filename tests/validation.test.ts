import { describe, it, expect, afterAll } from 'vitest';
import { adminInject, closeApp } from './setup.js';

afterAll(async () => { await closeApp(); });

describe('Zod validation tests', () => {
  it('POST /api/admin/teams with empty body → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/teams',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/teams with missing code → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/teams',
      payload: { name: 'NoCode', shortName: 'NC', color: '#000' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/players with missing name → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/players',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/players with empty name → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/players',
      payload: { name: '' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/seasons with invalid data (number as string) → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/seasons',
      payload: { number: 'not-a-number' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/seasons with missing number → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/seasons',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/weeks with missing required fields → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/weeks',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/weeks with invalid phase → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/weeks',
      payload: { seasonId: 1, weekNum: 1, date: '2026-01-01', phase: 'INVALID', venue: 'Test' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/announcements with empty body → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/announcements',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/users with missing fields → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/users',
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('POST /api/admin/users with invalid email → 400+', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/users',
      payload: { username: 'test', password: 'test', displayName: 'test', email: 'not-an-email' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
