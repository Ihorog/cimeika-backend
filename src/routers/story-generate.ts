import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateText } from '../services/perchance';

const storyGenerate = new Hono<{ Bindings: Env }>();

const GenerateStorySchema = z.object({
  prompt: z.string().min(1).max(2000),
  maxLength: z.number().int().min(100).max(5000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/**
 * POST /api/v1/story/generate
 * Validates input, calls Perchance text generator, persists to D1,
 * and returns the generated story.
 */
storyGenerate.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = GenerateStorySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: MESSAGES.ERROR_INVALID_INPUT, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, maxLength, temperature } = parsed.data;

    // Call Perchance text generator
    const textResult = await generateText(prompt, { maxLength, temperature });

    if (!textResult.success) {
      return c.json({ error: textResult.error ?? MESSAGES.ERROR_GENERIC }, { status: 502 });
    }

    const id = crypto.randomUUID();
    const content = textResult.text ?? '';
    const title = prompt.slice(0, 80);

    // Persist to D1 (prompt column added in schema)
    await c.env.DB.prepare(
      'INSERT INTO stories (id, title, content, prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, title, content, prompt, Date.now(), Date.now())
      .run();

    return c.json({
      success: true,
      story: {
        id,
        title,
        content,
        prompt,
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * GET /api/v1/story/:id
 * Retrieves a single story by ID from D1.
 */
storyGenerate.get('/:id', async (c) => {
  try {
    const storyId = c.req.param('id');
    const story = await c.env.DB.prepare('SELECT * FROM stories WHERE id = ?')
      .bind(storyId)
      .first<Record<string, unknown>>();

    if (!story) {
      return c.json({ error: MESSAGES.ERROR_NOT_FOUND }, { status: 404 });
    }

    return c.json({ success: true, story });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default storyGenerate;
