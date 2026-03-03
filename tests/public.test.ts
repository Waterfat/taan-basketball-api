import { describe, it, expect, afterAll } from 'vitest';
import { getApp, closeApp } from './setup.js';

afterAll(async () => { await closeApp(); });

describe('Public endpoints (no auth)', () => {
  it('GET /api/public/home → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/home' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('season');
    expect(body).toHaveProperty('standings');
  });

  it('GET /api/public/schedule → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/schedule' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('season');
  });

  it('GET /api/public/standings → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/standings' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('season');
    expect(body).toHaveProperty('teams');
  });

  it('GET /api/public/leaders → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/leaders' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/public/roster → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/roster' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/public/dragon → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/dragon' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/public/rotation → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/rotation' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/public/stats → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/public/stats' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /health → 200', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
  });

  it('GET /nonexistent → 404', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});
