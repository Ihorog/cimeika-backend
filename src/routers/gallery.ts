import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const gallery = new Hono<{ Bindings: Env }>();

gallery.get('/health', async (c) => {
  try {
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch (error) {
    console.error('Gallery health error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.post('/upload', async (c) => {
  try {
    // For file uploads, we would handle multipart/form-data
    // This is a simplified version
    return c.json({ message: 'Завантаження файлів буде доступне після налаштування' });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default gallery;
