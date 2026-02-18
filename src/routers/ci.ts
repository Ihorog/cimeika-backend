import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const ci = new Hono<{ Bindings: Env }>();

/**
 * GET /api/ci/health - Get Ci agent health
 */
ci.get('/health', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
    const response = await stub.fetch('https://agent/health');
    return response;
  } catch (error) {
    console.error('Ci health check error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * GET /api/ci/state - Get Ci agent state
 */
ci.get('/state', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
    const response = await stub.fetch('https://agent/state');
    return response;
  } catch (error) {
    console.error('Ci state error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * POST /api/ci/orchestrate - Trigger orchestration
 */
ci.post('/orchestrate', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);

    // Call orchestrateAgents method
    const response = await stub.fetch('https://agent/orchestrate', {
      method: 'POST',
    });

    return response;
  } catch (error) {
    console.error('Orchestration error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default ci;
