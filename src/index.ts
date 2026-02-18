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

// Import middleware
import {
  createAuthMiddleware,
  createCorsMiddleware,
  createErrorHandlerMiddleware,
  createLoggerMiddleware
} from './middleware';

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
 * Returns 200 if backend is running
 * Used by monitoring systems
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    agents: 7,
    environment: c.env.ENVIRONMENT
  });
});

/**
 * System status endpoint
 * Returns detailed system and agent status
 */
app.get('/api/status', async (c) => {
  return c.json({
    system: 'INITIALIZING',
    timestamp: new Date().toISOString(),
    agents: {
      ci: { status: 'ready', uptime: 0 },
      podiya: { status: 'ready', uptime: 0 },
      nastriy: { status: 'ready', uptime: 0 },
      malya: { status: 'ready', uptime: 0 },
      kazkar: { status: 'ready', uptime: 0 },
      kalendar: { status: 'ready', uptime: 0 },
      gallery: { status: 'ready', uptime: 0 }
    },
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
        'GET/POST /api/agents/ci',
        'GET/POST /api/agents/podiya',
        'GET/POST /api/agents/nastriy',
        'GET/POST /api/agents/malya',
        'GET/POST /api/agents/kazkar',
        'GET/POST /api/agents/kalendar',
        'GET/POST /api/agents/gallery'
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
// AGENT ROUTE PLACEHOLDERS
// ============================================

// These will be implemented in Pool B (B1-B7)
// For now: stub responses to verify routing

/**
 * Ci Agent endpoints (Orchestration)
 */
app.get('/api/agents/ci/status', (c) => {
  return c.json({ agent: 'Ci', status: 'ready' });
});

app.post('/api/agents/ci', (c) => {
  return c.json({ agent: 'Ci', message: 'Processing...' });
});

/**
 * Podiya Agent endpoints (Events)
 */
app.get('/api/agents/podiya/status', (c) => {
  return c.json({ agent: 'Подія', status: 'ready' });
});

app.post('/api/agents/podiya', (c) => {
  return c.json({ agent: 'Подія', message: 'Processing...' });
});

/**
 * Nastriy Agent endpoints (Mood)
 */
app.get('/api/agents/nastriy/status', (c) => {
  return c.json({ agent: 'Настрій', status: 'ready' });
});

app.post('/api/agents/nastriy', (c) => {
  return c.json({ agent: 'Настрій', message: 'Processing...' });
});

/**
 * Malya Agent endpoints (Ideas)
 */
app.get('/api/agents/malya/status', (c) => {
  return c.json({ agent: 'Маля', status: 'ready' });
});

app.post('/api/agents/malya', (c) => {
  return c.json({ agent: 'Маля', message: 'Processing...' });
});

/**
 * Kazkar Agent endpoints (Stories)
 */
app.get('/api/agents/kazkar/status', (c) => {
  return c.json({ agent: 'Казкар', status: 'ready' });
});

app.post('/api/agents/kazkar', (c) => {
  return c.json({ agent: 'Казкар', message: 'Processing...' });
});

/**
 * Kalendar Agent endpoints (Time)
 */
app.get('/api/agents/kalendar/status', (c) => {
  return c.json({ agent: 'Календар', status: 'ready' });
});

app.post('/api/agents/kalendar', (c) => {
  return c.json({ agent: 'Календар', message: 'Processing...' });
});

/**
 * Gallery Agent endpoints (Media)
 */
app.get('/api/agents/gallery/status', (c) => {
  return c.json({ agent: 'Галерея', status: 'ready' });
});

app.post('/api/agents/gallery', (c) => {
  return c.json({ agent: 'Галерея', message: 'Processing...' });
});

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

export default app;
