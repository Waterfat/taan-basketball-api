import { describe, it, expect, afterAll } from 'vitest';
import { getApp, closeApp } from './setup.js';

afterAll(async () => { await closeApp(); });

describe('Auth endpoints', () => {
  it('POST /api/auth/login with valid credentials → 200 + tokens', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'admin123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('admin');
    expect(body.user.role).toBe('SUPER_ADMIN');
  });

  it('POST /api/auth/login with invalid credentials → 401', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBeDefined();
  });

  it('POST /api/auth/login with non-existent user → 401', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nouser_xyz', password: 'anything' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/me with valid token → 200 + user info', async () => {
    const app = await getApp();
    // Login first
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'admin123' },
    });
    const { accessToken } = loginRes.json();

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('admin');
  });

  it('GET /api/auth/me without token → 401', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/me with invalid token → 401', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/refresh with valid refresh token → new tokens', async () => {
    const app = await getApp();
    // Login to get a refresh token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'admin123' },
    });
    const { refreshToken } = loginRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    // The new refresh token should be different (rotation)
    expect(body.refreshToken).not.toBe(refreshToken);
  });

  it('POST /api/auth/refresh with invalid token → 401', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'invalid-refresh-token' },
    });
    expect(res.statusCode).toBe(401);
  });
});
