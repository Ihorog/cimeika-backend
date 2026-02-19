import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const ci = new Hono<{ Bindings: Env }>();

/**
 * GET /api/agents/ci/status - Get Ci agent status
 */
ci.get('/status', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
    const response = await stub.fetch('https://agent/status');
    return response;
  } catch (error) {
    console.error('Ci status error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * GET /api/agents/ci/health - Get Ci agent health
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
 * GET /api/agents/ci/state - Get Ci agent state
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
 * GET /api/agents/ci/agents - List all agents
 */
ci.get('/agents', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
    const response = await stub.fetch('https://agent/agents');
    return response;
  } catch (error) {
    console.error('Ci agents list error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * POST /api/agents/ci - Send message to Ci agent
 */
ci.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
    const response = await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error) {
    console.error('Ci message error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * POST /api/agents/ci/orchestrate - Trigger orchestration
 */
ci.post('/orchestrate', async (c) => {
  try {
    const id = c.env.CI_AGENT.idFromName('ci-agent');
    const stub = c.env.CI_AGENT.get(id);
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
