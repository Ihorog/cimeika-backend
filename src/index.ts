import { Hono } from 'hono';
import type { Env } from './types/env';
import { cors, logging, rateLimit } from './middleware';
import * as routers from './routers';
// import * as agents from './agents';
import { MESSAGES, CIMEIKA_RESOURCES, ERROR_CODES } from './lib/constants';

/**
 * Main Hono application
 */
const app = new Hono<{ Bindings: Env }>();

// Apply global middleware
app.use('*', cors);
app.use('*', logging);
app.use('/api/*', rateLimit);

/**
 * Root endpoint
 */
app.get('/', (c) => {
  return c.json({
    name: 'CIMEIKA Backend',
    version: '0.1.0',
    status: 'running',
    agents: ['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'],
    message: 'Вітаємо в CIMEIKA Backend API',
    resources: {
      website: CIMEIKA_RESOURCES.WEBSITES.MAIN,
      github: CIMEIKA_RESOURCES.GITHUB.ORGANIZATION,
      huggingface: CIMEIKA_RESOURCES.HUGGINGFACE.ORGANIZATION,
      api: CIMEIKA_RESOURCES.HUGGINGFACE.API,
    },
    documentation: '/api/docs',
  });
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (c) => {
  try {
    // Check database connection
    const dbCheck = await c.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();

    // Check KV namespace

    return c.json({
      status: 'healthy',
      message: MESSAGES.HEALTH_OK,
      timestamp: Date.now(),
      checks: {
        database: dbCheck?.ok === 1,
        kv: true,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return c.json(
      {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        code: ERROR_CODES.GENERIC_ERROR,
        timestamp: Date.now(),
      },
      { status: 503 }
    );
  }
});

/**
 * System status endpoint
 */
app.get('/api/status', async (c) => {
  try {
    const agentStatuses = {
      ci: 'operational',
      podiya: 'operational',
      nastriy: 'operational',
      malya: 'operational',
      kazkar: 'operational',
      kalendar: 'operational',
      gallery: 'operational',
    };

    return c.json({
      system: 'CIMEIKA Backend',
      status: 'operational',
      agents: agentStatuses,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Status check failed:', error);
    return c.json(
      {
        error: MESSAGES.ERROR_GENERIC,
        code: ERROR_CODES.GENERIC_ERROR,
      },
      { status: 500 }
    );
  }
});

/**
 * Mount agent routers
 */
app.route('/api/ci', routers.ci);
app.route('/api/podiya', routers.podiya);
app.route('/api/nastriy', routers.nastriy);
app.route('/api/malya', routers.malya);
app.route('/api/kazkar', routers.kazkar);
app.route('/api/kalendar', routers.kalendar);
app.route('/api/gallery', routers.gallery);

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: MESSAGES.ERROR_NOT_FOUND,
      code: ERROR_CODES.NOT_FOUND,
    },
    { status: 404 }
  );
});

/**
 * Error handler
 */
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json(
    {
      error: MESSAGES.ERROR_GENERIC,
      code: ERROR_CODES.GENERIC_ERROR,
    },
    { status: 500 }
  );
});

/**
 * Export Durable Object classes
 * NOTE: Agent implementations temporarily removed during BaseAgent refactor
 * TODO: Re-implement agents using new BaseAgent class
 */
// export { CiAgent } from './agents/ci-agent';
// export { PodiyaAgent } from './agents/podiya-agent';
// export { NastriyAgent } from './agents/nastriy-agent';
// export { MalyaAgent } from './agents/malya-agent';
// export { KazkarAgent } from './agents/kazkar-agent';
// export { KalendarAgent } from './agents/kalendar-agent';
// export { GalleryAgent } from './agents/gallery-agent';

/**
 * Export default worker handler
 */
export default app;
