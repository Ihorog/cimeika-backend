import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';

const podiya = new Hono<{ Bindings: Env }>();

/**
 * GET /api/podiya/health - Get Podiya agent health
 */
podiya.get('/health', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    const response = await stub.fetch('https://agent/health');
    return response;
  } catch (error) {
    console.error('Podiya health check error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * GET /api/podiya/state - Get Podiya agent state
 */
podiya.get('/state', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    const response = await stub.fetch('https://agent/state');
    return response;
  } catch (error) {
    console.error('Podiya state error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * POST /api/podiya/event - Create new event
 */
podiya.post('/event', async (c) => {
  try {
    const body = await c.req.json();
    const { type, data } = body;

    if (!type) {
      return c.json({ error: MESSAGES.ERROR_INVALID_INPUT }, { status: 400 });
    }

    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'api',
      to: 'podiya',
      payload: { action: 'create_event', type, data },
      priority: 'medium',
      timestamp: now(),
    };

    const response = await stub.fetch('https://agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    return response;
  } catch (error) {
    console.error('Podiya event creation error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default podiya;
