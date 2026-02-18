import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';

const malya = new Hono<{ Bindings: Env }>();

malya.get('/health', async (c) => {
  try {
    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch (error) {
    console.error('Malya health error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

malya.post('/idea', async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ error: MESSAGES.ERROR_INVALID_INPUT }, { status: 400 });
    }

    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'api',
      to: 'malya',
      payload: { action: 'add_idea', content },
      priority: 'medium',
      timestamp: now(),
    };

    return await stub.fetch('https://agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Malya idea error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default malya;
