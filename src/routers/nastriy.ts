import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { HonoVariables } from '../types/hono';
import { MESSAGES } from '../lib/constants';
import { generateId, now } from '../lib/utils';
import { validateBody } from '../middleware/validation';
import { nastriyMoodSchema } from '../lib/validation';
import type { z } from 'zod';

const nastriy = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

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
nastriy.post('/mood', validateBody(nastriyMoodSchema), async (c) => {
  try {
    const body = c.get('validatedBody') as z.infer<typeof nastriyMoodSchema>;
    const { mood, score, note } = body;

    const id = c.env.NASTRIY_AGENT.idFromName('nastriy-agent');
    const stub = c.env.NASTRIY_AGENT.get(id);

    const message = {
      id: generateId(),
      type: 'request',
      from: 'nastriy',
      to: 'nastriy',
      payload: { action: 'update_mood', mood, score, note },
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
