import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const kazkar = new Hono<{ Bindings: Env }>();

kazkar.get('/status', async (c) => {
  try {
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.get('/health', async (c) => {
  try {
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.get('/stories', async (c) => {
  try {
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/stories');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.get('/stories/:id', async (c) => {
  try {
    const storyId = c.req.param('id');
    const agentId = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(agentId);
    return await stub.fetch(`https://agent/stories/${storyId}`);
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.post('/stories', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/stories', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default kazkar;
