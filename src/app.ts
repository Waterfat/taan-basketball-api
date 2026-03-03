import 'dotenv/config';
import './types/index.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import prisma from './prisma.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public/index.js';
import adminRoutes from './routes/admin/index.js';

const fastify = Fastify({
  logger: config.server.nodeEnv === 'development',
});

// Plugins
await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    const allowed = [
      'http://localhost:5174',
      'http://localhost:8765',
      'https://waterfat.github.io',
    ];
    // Also allow any trycloudflare.com subdomain
    if (allowed.includes(origin) || origin.endsWith('.trycloudflare.com')) {
      return cb(null, true);
    }
    cb(null, false);
  },
  credentials: true,
});
await fastify.register(jwt, { secret: config.jwt.secret, sign: { expiresIn: config.jwt.accessExpiresIn } });

// Auth decorator (available to all child contexts)
fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  if ('statusCode' in error && typeof error.statusCode === 'number' && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  request.log.error(error);
  return reply.status(500).send({ error: 'Internal server error' });
});

// Health check
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(publicRoutes, { prefix: '/api/public' });
fastify.register(adminRoutes, { prefix: '/api/admin' });

// Start
try {
  await fastify.listen({ port: config.server.port, host: config.server.host });
  console.log(`Server running on http://${config.server.host}:${config.server.port}`);
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
