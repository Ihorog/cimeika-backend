import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';
import { generateImage, type PerchanceGenerator } from '../services/perchance';
import { uploadToR2, generateR2Key } from '../services/r2-stream';

const galleryGenerate = new Hono<{ Bindings: Env }>();

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(1000),
  generator: z
    .enum([
      'ai-anime-generator',
      'ai-furry-generator',
      'ai-landscape-generator',
      'ai-portrait-generator',
      'ai-text',
      'ai-character-generator',
    ])
    .optional()
    .default('ai-anime-generator'),
});

/**
 * POST /api/v1/gallery/generate
 * Validates input, calls Perchance image generator, uploads to R2,
 * persists metadata to D1, and returns the gallery item.
 */
galleryGenerate.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = GenerateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: MESSAGES.ERROR_INVALID_INPUT, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, generator } = parsed.data;

    // Call Perchance image generator
    const imageResult = await generateImage(prompt, generator as PerchanceGenerator);

    if (!imageResult.success) {
      return c.json({ error: imageResult.error ?? MESSAGES.ERROR_GENERIC }, { status: 502 });
    }

    // Upload base64 image to R2 if returned
    const id = crypto.randomUUID();
    let publicUrl = imageResult.imageUrl ?? '';

    if (imageResult.imageData) {
      const key = generateR2Key('gallery', 'jpg');
      const binary = Uint8Array.from(atob(imageResult.imageData), (ch) => ch.charCodeAt(0));
      await uploadToR2(c.env, binary.buffer as ArrayBuffer, {
        key,
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });
      publicUrl = key;
    }

    // Persist metadata to D1
    await c.env.DB.prepare(
      'INSERT INTO gallery_items (id, url, prompt, generator, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
    )
      .bind(id, publicUrl, prompt, generator)
      .run();

    return c.json({
      success: true,
      item: {
        id,
        url: publicUrl,
        prompt,
        generator,
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

/**
 * GET /api/v1/gallery
 * Returns the most recent gallery items from D1.
 */
galleryGenerate.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM gallery_items ORDER BY created_at DESC LIMIT 100'
    ).all<Record<string, unknown>>();

    return c.json({ success: true, items: result.results ?? [] });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default galleryGenerate;
