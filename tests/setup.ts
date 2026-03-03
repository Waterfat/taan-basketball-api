import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance | null = null;
let cachedTokens: { accessToken: string; refreshToken: string } | null = null;

/** Build (or return existing) Fastify app for testing */
export async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

/** Close the app after tests */
export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
    cachedTokens = null;
  }
}

/** Login as admin and return tokens */
export async function getAdminTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  if (cachedTokens) return cachedTokens;
  const fastify = await getApp();
  const res = await fastify.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'admin', password: 'admin123' },
  });
  const body = res.json();
  cachedTokens = { accessToken: body.accessToken, refreshToken: body.refreshToken };
  return cachedTokens;
}

/** Helper: inject with admin auth header */
export async function adminInject(opts: {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  payload?: unknown;
}) {
  const fastify = await getApp();
  const { accessToken } = await getAdminTokens();
  return fastify.inject({
    method: opts.method,
    url: opts.url,
    payload: opts.payload,
    headers: { authorization: `Bearer ${accessToken}` },
  });
}
