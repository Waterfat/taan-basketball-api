import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Users CRUD', () => {
  let createdUserId: number;
  const testUsername = `testuser_${Date.now()}`;

  it('GET /api/admin/users → list', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/users' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0); // at least the admin user
  });

  it('POST /api/admin/users → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/users',
      payload: {
        username: testUsername,
        password: 'testpass123',
        displayName: 'Test User',
        role: 'VIEWER',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe(testUsername);
    createdUserId = body.data.id;
  });

  it('GET /api/admin/users/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/users/${createdUserId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdUserId);
  });

  it('PATCH /api/admin/users/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/users/${createdUserId}`,
      payload: { displayName: 'Updated Test User', role: 'PLAYER' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe('Updated Test User');
  });

  it('DELETE /api/admin/users/:id → delete', async () => {
    const res = await adminInject({ method: 'DELETE', url: `/api/admin/users/${createdUserId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/admin/users without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/users' });
    expect(res.statusCode).toBe(401);
  });
});
