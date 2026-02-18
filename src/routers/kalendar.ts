import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';

const kalendar = new Hono<{ Bindings: Env }>();

kalendar.get('/health', async (c) => {
  try {
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch (error) {
    console.error('Kalendar health error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.post('/schedule', async (c) => {
  try {
    const body = await c.req.json();
    const { time, description } = body;

    if (!time || !description) {
      return c.json({ error: MESSAGES.ERROR_INVALID_INPUT }, { status: 400 });
    }

    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'api',
      to: 'kalendar',
      payload: { action: 'schedule_event', time, description },
      priority: 'medium',
      timestamp: now(),
    };

    return await stub.fetch('https://agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Kalendar schedule error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default kalendar;
