import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const malya = new Hono<{ Bindings: Env }>();

malya.get('/status', async (c) => {
  try {
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.get('/health', async (c) => {
  try {
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.get('/ideas', async (c) => {
  try {
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/ideas');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.post('/ideas', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/ideas', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.put('/ideas/:id', async (c) => {
  try {
    const ideaId = c.req.param('id');
    const body = await c.req.json();
    const agentId = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(agentId);
    return await stub.fetch(`https://agent/ideas/${ideaId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default malya;
