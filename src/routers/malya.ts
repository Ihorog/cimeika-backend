import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { HonoVariables } from '../types/hono';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';
import { validateBody } from '../middleware/validation';
import { malyaIdeaSchema } from '../lib/validation';
import type { z } from 'zod';

const malya = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

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

malya.post('/idea', validateBody(malyaIdeaSchema), async (c) => {
  try {
    const body = c.get('validatedBody') as z.infer<typeof malyaIdeaSchema>;
    const { content, tags, category } = body;

    const id = c.env.MALYA_AGENT.idFromName('malya-agent');
    const stub = c.env.MALYA_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'malya',
      to: 'malya',
      payload: { action: 'add_idea', content, tags, category },
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
