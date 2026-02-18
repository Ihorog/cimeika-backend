import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';

const nastriy = new Hono<{ Bindings: Env }>();

/**
 * GET /api/nastriy/health
 */
nastriy.get('/health', async (c) => {
  try {
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    const response = await stub.fetch('https://agent/health');
    return response;
  } catch (error) {
    console.error('Nastriy health check error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * POST /api/nastriy/mood - Update mood
 */
nastriy.post('/mood', async (c) => {
  try {
    const body = await c.req.json();
    const { mood, score } = body;

    if (!mood || typeof score !== 'number') {
      return c.json({ error: MESSAGES.ERROR_INVALID_INPUT }, { status: 400 });
    }

    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'api',
      to: 'nastriy',
      payload: { action: 'update_mood', mood, score },
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
    console.error('Nastriy mood update error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default nastriy;
