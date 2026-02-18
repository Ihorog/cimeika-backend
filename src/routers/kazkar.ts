import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';

const kazkar = new Hono<{ Bindings: Env }>();

kazkar.get('/health', async (c) => {
  try {
    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch (error) {
    console.error('Kazkar health error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

kazkar.post('/story', async (c) => {
  try {
    const body = await c.req.json();
    const { title, content } = body;

    if (!title || !content) {
      return c.json({ error: MESSAGES.ERROR_INVALID_INPUT }, { status: 400 });
    }

    const id = c.env.KAZKAR_AGENT.idFromName('kazkar-agent');
    const stub = c.env.KAZKAR_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'api',
      to: 'kazkar',
      payload: { action: 'add_story', title, content },
      priority: 'medium',
      timestamp: now(),
    };

    return await stub.fetch('https://agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Kazkar story error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default kazkar;
