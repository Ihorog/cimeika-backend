/**
 * CIMEIKA Backend - Main Entry Point
 * Hono-based REST API with 7 Durable Object Agents
 *
 * Language Invariant:
 * - UI/API Messages: Українська
 * - Code: English
 */

import { Hono } from 'hono';
import type { Env } from './types';
import { getHealthStatus } from './lib/health-check';

// Import middleware
import {
  createAuthMiddleware,
  createCorsMiddleware,
  createErrorHandlerMiddleware,
  createLoggerMiddleware
} from './middleware';

// Import routers
import ciRouter from './routers/ci';
import podiyaRouter from './routers/podiya';
import nastriyRouter from './routers/nastriy';
import malyaRouter from './routers/malya';
import kazkarRouter from './routers/kazkar';
import kalendarRouter from './routers/kalendar';
import galleryRouter from './routers/gallery';

// ============================================
// CREATE HONO APP
// ============================================

const app = new Hono<{ Bindings: Env }>();

// ============================================
// MIDDLEWARE STACK (Order matters!)
// ============================================

app.use('*', createErrorHandlerMiddleware());
app.use('*', createCorsMiddleware());
app.use('*', createLoggerMiddleware());
app.use('*', createAuthMiddleware());

// ============================================
// HEALTH & STATUS ENDPOINTS
// ============================================

/**
 * Health check endpoint
 * Returns 200 if backend is UP, 503 if DEGRADED/DOWN
 */
app.get('/api/health', async (c) => {
  const health = await getHealthStatus(c.env);
  const httpStatus = health.status === 'UP' ? 200 : 503;
  return c.json(health, httpStatus);
});

/**
 * System status endpoint
 * Returns detailed system and agent status by querying each DO
 */
app.get('/api/status', async (c) => {
  const agentBindings = [
    { name: 'ci', binding: c.env.CI_AGENT, id: 'ci-agent' },
    { name: 'podiya', binding: c.env.PODIYA_AGENT, id: 'podiya-agent' },
    { name: 'nastriy', binding: c.env.NASTRIY_AGENT, id: 'nastriy-agent' },
    { name: 'malya', binding: c.env.MALYA_AGENT, id: 'malya-agent' },
    { name: 'kazkar', binding: c.env.KAZKAR_AGENT, id: 'kazkar-agent' },
    { name: 'kalendar', binding: c.env.KALENDAR_AGENT, id: 'kalendar-agent' },
    { name: 'gallery', binding: c.env.GALLERY_AGENT, id: 'gallery-agent' },
  ];

  const results = await Promise.allSettled(
    agentBindings.map(async ({ name, binding, id }) => {
      const stub = binding.get(binding.idFromName(id));
      const res = await stub.fetch('https://agent/status');
      const data = await res.json() as Record<string, unknown>;
      return { name, ...data };
    })
  );

  const agents: Record<string, unknown> = {};
  for (let i = 0; i < agentBindings.length; i++) {
    const result = results[i];
    const { name } = agentBindings[i];
    if (result.status === 'fulfilled') {
      agents[name] = result.value;
    } else {
      agents[name] = { status: 'error', error: 'Недоступний' };
    }
  }

  return c.json({
    system: 'CIMEIKA',
    timestamp: new Date().toISOString(),
    agents,
    bindings: {
      durable_objects: 7,
      kv_namespaces: 2,
      database: 'ok',
      r2_bucket: 'ok',
      analytics: 'ok'
    }
  });
});

/**
 * API manifest endpoint
 * Lists all available endpoints and agents
 */
app.get('/api/manifest', (c) => {
  return c.json({
    name: 'CIMEIKA Backend',
    version: '0.1.0',
    description: '7 Agents on Cloudflare Workers',
    endpoints: {
      health: 'GET /api/health',
      status: 'GET /api/status',
      manifest: 'GET /api/manifest',
      agents: [
        'GET /api/agents/ci/status, POST /api/agents/ci',
        'GET /api/agents/podiya/status, POST /api/agents/podiya',
        'GET /api/agents/nastriy/status, POST /api/agents/nastriy',
        'GET /api/agents/malya/status, POST /api/agents/malya',
        'GET /api/agents/kazkar/status, POST /api/agents/kazkar',
        'GET /api/agents/kalendar/status, POST /api/agents/kalendar',
        'GET /api/agents/gallery/status, POST /api/agents/gallery'
      ]
    },
    agents: {
      ci: 'Центр керування та оркестрація',
      podiya: 'Майбутнє та події',
      nastriy: 'Емоційні стани та контекст',
      malya: 'Ідеї та альтернативи',
      kazkar: 'Історії та наратив',
      kalendar: 'Час та ритми',
      gallery: 'Візуальний архів'
    }
  });
});

// ============================================
// AGENT ROUTES (Real Durable Object proxies)
// ============================================

app.route('/api/agents/ci', ciRouter);
app.route('/api/agents/podiya', podiyaRouter);
app.route('/api/agents/nastriy', nastriyRouter);
app.route('/api/agents/malya', malyaRouter);
app.route('/api/agents/kazkar', kazkarRouter);
app.route('/api/agents/kalendar', kalendarRouter);
app.route('/api/agents/gallery', galleryRouter);

// ============================================
// 404 HANDLER
// ============================================

/**
 * Not found handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: true,
      message: 'Не знайдено',
      path: c.req.path,
      method: c.req.method
    },
    404
  );
});

// ============================================
// EXPORT
// ============================================

/**
 * Export Durable Object classes
 */
export { CiAgent } from './agents/ci-agent';
export { PodiyaAgent } from './agents/podiya-agent';
export { NastriyAgent } from './agents/nastriy-agent';
export { MalyaAgent } from './agents/malya-agent';
export { KazkarAgent } from './agents/kazkar-agent';
export { KalendarAgent } from './agents/kalendar-agent';
export { GalleryAgent } from './agents/gallery-agent';

export default app;
