import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const podiya = new Hono<{ Bindings: Env }>();

podiya.get('/status', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.get('/health', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.get('/list', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/list');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.get('/upcoming', async (c) => {
  try {
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/upcoming');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(id);
    return await stub.fetch('https://agent/create', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

podiya.delete('/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    const agentId = c.env.PODIYA_AGENT.idFromName('podiya-agent');
    const stub = c.env.PODIYA_AGENT.get(agentId);
    return await stub.fetch(`https://agent/delete/${eventId}`, { method: 'DELETE' });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default podiya;
