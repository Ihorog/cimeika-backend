import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const kalendar = new Hono<{ Bindings: Env }>();

kalendar.get('/status', async (c) => {
  try {
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.get('/health', async (c) => {
  try {
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.get('/events', async (c) => {
  try {
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/events');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.get('/today', async (c) => {
  try {
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/today');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kalendar.post('/events', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.KALENDAR_AGENT.idFromName('kalendar-agent');
    const stub = c.env.KALENDAR_AGENT.get(id);
    return await stub.fetch('https://agent/events', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default kalendar;
