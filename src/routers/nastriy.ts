import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const nastriy = new Hono<{ Bindings: Env }>();

nastriy.get('/status', async (c) => {
  try {
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

nastriy.get('/health', async (c) => {
  try {
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

nastriy.get('/current', async (c) => {
  try {
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/current');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

nastriy.get('/history', async (c) => {
  try {
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/history');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

nastriy.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

nastriy.post('/track', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);
    return await stub.fetch('https://agent/track', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default nastriy;
