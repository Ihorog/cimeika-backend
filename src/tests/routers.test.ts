import { describe, it, expect, vi } from 'vitest';
import type { Env } from '../types';
import ciRouter from '../routers/ci';
import podiyaRouter from '../routers/podiya';
import nastriyRouter from '../routers/nastriy';
import malyaRouter from '../routers/malya';
import kazkarRouter from '../routers/kazkar';
import kalendarRouter from '../routers/kalendar';
import galleryRouter from '../routers/gallery';

// Helper: create mock stub that returns given JSON
function makeMockStub(data: Record<string, unknown>, status = 200) {
  return {
    fetch: vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  };
}

// Helper: create mock namespace
function makeMockNamespace(stubData: Record<string, unknown>) {
  const stub = makeMockStub(stubData);
  return {
    idFromName: vi.fn().mockReturnValue('mock-id'),
    get: vi.fn().mockReturnValue(stub),
    _stub: stub  // for call verification
  };
}

describe('ci router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'ci', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { CI_AGENT: ns } as unknown as Env;

    const res = await ciRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('ci');
    expect(body.status).toBe('ready');
  });

  it('POST /orchestrate → returns { success: true }', async () => {
    const ns = makeMockNamespace({ success: true });
    const env = { CI_AGENT: ns } as unknown as Env;

    const res = await ciRouter.request('/orchestrate', { method: 'POST' }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.success).toBe(true);
  });
});

describe('podiya router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'podiya', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { PODIYA_AGENT: ns } as unknown as Env;

    const res = await podiyaRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('podiya');
  });

  it('POST /create → returns { event_id: string }', async () => {
    const ns = makeMockNamespace({ success: true, event_id: 'evt-001' });
    const env = { PODIYA_AGENT: ns } as unknown as Env;

    const res = await podiyaRouter.request('/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test-event' })
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.event_id).toBe('string');
  });
});

describe('nastriy router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'nastriy', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { NASTRIY_AGENT: ns } as unknown as Env;

    const res = await nastriyRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('nastriy');
  });

  it('POST /track → returns { entry_id: string }', async () => {
    const ns = makeMockNamespace({ success: true, entry_id: 'entry-001' });
    const env = { NASTRIY_AGENT: ns } as unknown as Env;

    const res = await nastriyRouter.request('/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: 'happy', score: 8 })
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.entry_id).toBe('string');
  });
});

describe('malya router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'malya', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { MALYA_AGENT: ns } as unknown as Env;

    const res = await malyaRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('malya');
  });

  it('POST /ideas → returns { idea_id: string }', async () => {
    const ns = makeMockNamespace({ success: true, idea_id: 'idea-001' });
    const env = { MALYA_AGENT: ns } as unknown as Env;

    const res = await malyaRouter.request('/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Idea' })
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.idea_id).toBe('string');
  });
});

describe('kazkar router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'kazkar', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { KAZKAR_AGENT: ns } as unknown as Env;

    const res = await kazkarRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('kazkar');
  });

  it('POST /stories → returns { story_id: string }', async () => {
    const ns = makeMockNamespace({ success: true, story_id: 'story-001' });
    const env = { KAZKAR_AGENT: ns } as unknown as Env;

    const res = await kazkarRouter.request('/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'A Story', content: 'Once upon a time...' })
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.story_id).toBe('string');
  });
});

describe('kalendar router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'kalendar', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { KALENDAR_AGENT: ns } as unknown as Env;

    const res = await kalendarRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('kalendar');
  });

  it('POST /events → returns { event_id: string }', async () => {
    const ns = makeMockNamespace({ success: true, event_id: 'evt-002' });
    const env = { KALENDAR_AGENT: ns } as unknown as Env;

    const res = await kalendarRouter.request('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Meeting', date: '2026-03-01' })
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(typeof body.event_id).toBe('string');
  });
});

describe('gallery router', () => {
  it('GET /status → returns data from DO', async () => {
    const statusData = { agent: 'gallery', status: 'ready' };
    const ns = makeMockNamespace(statusData);
    const env = { GALLERY_AGENT: ns } as unknown as Env;

    const res = await galleryRouter.request('/status', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.agent).toBe('gallery');
  });

  it('GET /files → returns array { files: [] }', async () => {
    const ns = makeMockNamespace({ files: [] });
    const env = { GALLERY_AGENT: ns } as unknown as Env;

    const res = await galleryRouter.request('/files', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(Array.isArray(body.files)).toBe(true);
  });
});

