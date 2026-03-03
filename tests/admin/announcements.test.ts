import { describe, it, expect, afterAll } from 'vitest';
import { getApp, adminInject, closeApp } from '../setup.js';

afterAll(async () => { await closeApp(); });

describe('Admin Announcements CRUD', () => {
  let createdId: number;

  it('GET /api/admin/announcements → list', async () => {
    const res = await adminInject({ method: 'GET', url: '/api/admin/announcements' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/admin/announcements → create', async () => {
    const res = await adminInject({
      method: 'POST',
      url: '/api/admin/announcements',
      payload: {
        title: `Test Announcement ${Date.now()}`,
        content: 'This is a test announcement.',
        isPinned: false,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toContain('Test Announcement');
    createdId = body.data.id;
  });

  it('GET /api/admin/announcements/:id → get by id', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/announcements/${createdId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdId);
  });

  it('PATCH /api/admin/announcements/:id → update', async () => {
    const res = await adminInject({
      method: 'PATCH',
      url: `/api/admin/announcements/${createdId}`,
      payload: { title: 'Updated Announcement', isPinned: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Announcement');
  });

  it('DELETE /api/admin/announcements/:id → delete', async () => {
    const res = await adminInject({ method: 'DELETE', url: `/api/admin/announcements/${createdId}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });

  it('GET /api/admin/announcements/:id after delete → 404', async () => {
    const res = await adminInject({ method: 'GET', url: `/api/admin/announcements/${createdId}` });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/admin/announcements without auth → 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/admin/announcements' });
    expect(res.statusCode).toBe(401);
  });
});
