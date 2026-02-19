import { Hono } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

const gallery = new Hono<{ Bindings: Env }>();

gallery.get('/status', async (c) => {
  try {
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/status');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.get('/health', async (c) => {
  try {
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/health');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.get('/files', async (c) => {
  try {
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/files');
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.get('/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const agentId = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(agentId);
    return await stub.fetch(`https://agent/files/${encodeURIComponent(key)}`);
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const id = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(id);
    return await stub.fetch('https://agent/upload', {
      method: 'POST',
      body: formData,
    });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

gallery.delete('/files/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const agentId = c.env.GALLERY_AGENT.idFromName('gallery-agent');
    const stub = c.env.GALLERY_AGENT.get(agentId);
    return await stub.fetch(`https://agent/files/${encodeURIComponent(key)}`, { method: 'DELETE' });
  } catch {
    return c.json({ error: MESSAGES.ERROR_GENERIC }, { status: 500 });
  }
});

export default gallery;
