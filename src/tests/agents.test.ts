import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CiAgent } from '../agents/ci-agent';
import { PodiyaAgent } from '../agents/podiya-agent';
import { NastriyAgent } from '../agents/nastriy-agent';
import { MalyaAgent } from '../agents/malya-agent';
import { KazkarAgent } from '../agents/kazkar-agent';
import { KalendarAgent } from '../agents/kalendar-agent';
import { GalleryAgent } from '../agents/gallery-agent';
import type { AgentMessage } from '../types/agents';

/**
 * Create mock DurableObjectState
 */
function createMockState(): DurableObjectState {
  return {
    id: { toString: () => 'test-id-123' } as DurableObjectId,
    storage: {} as DurableObjectStorage,
    waitUntil: vi.fn(),
    blockConcurrencyWhile: vi.fn(),
  } as unknown as DurableObjectState;
}

/**
 * Create mock Env
 */
function createMockEnv() {
  return {
    CI_AGENT: {} as DurableObjectNamespace,
    PODIYA_AGENT: {} as DurableObjectNamespace,
    NASTRIY_AGENT: {} as DurableObjectNamespace,
    MALYA_AGENT: {} as DurableObjectNamespace,
    KAZKAR_AGENT: {} as DurableObjectNamespace,
    KALENDAR_AGENT: {} as DurableObjectNamespace,
    GALLERY_AGENT: {} as DurableObjectNamespace,
    CONFIG: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as KVNamespace,
    AUTH_TOKENS: {} as KVNamespace,
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({}),
        first: vi.fn().mockResolvedValue(null),
      }),
    } as unknown as D1Database,
    FILES: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    } as unknown as R2Bucket,
    ANALYTICS: {
      writeDataPoint: vi.fn(),
    } as unknown as AnalyticsEngineDataset,
    ENVIRONMENT: 'development' as const,
  };
}

/**
 * Create a test message
 */
function createTestMessage(action: string, payload: Record<string, any> = {}): AgentMessage {
  return {
    id: 'test-msg-001',
    type: 'command',
    from: 'ci',
    to: 'ci',
    payload: { action, ...payload },
    timestamp: new Date().toISOString(),
  };
}

describe('CiAgent', () => {
  let agent: CiAgent;

  beforeEach(() => {
    agent = new CiAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('ci');
    expect(body.status).toBe('ready');
  });

  it('should return state on GET /state', async () => {
    const req = new Request('https://agent/state');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.type).toBe('ci');
    expect(body.name).toBe('Ci');
  });

  it('should handle orchestration on POST /orchestrate', async () => {
    const req = new Request('https://agent/orchestrate', { method: 'POST' });
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should process status_report message', async () => {
    const message = createTestMessage('status_report');
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.agents).toBeDefined();
  });

  it('should return 404 for unknown paths', async () => {
    const req = new Request('https://agent/unknown');
    const res = await agent.fetch(req);

    expect(res.status).toBe(404);
  });
});

describe('PodiyaAgent', () => {
  let agent: PodiyaAgent;

  beforeEach(() => {
    agent = new PodiyaAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('podiya');
  });

  it('should process create-event message', async () => {
    const message = createTestMessage('create-event', {
      type: 'test-event',
      data: { title: 'Test' },
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.message).toBe('Подію створено');
  });
});

describe('NastriyAgent', () => {
  let agent: NastriyAgent;

  beforeEach(() => {
    agent = new NastriyAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('nastriy');
  });

  it('should process track-mood message', async () => {
    const message = createTestMessage('track-mood', {
      mood: 'happy',
      score: 8,
      note: 'Feeling good',
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.mood).toBe('happy');
    expect(result.data?.score).toBe(8);
  });
});

describe('MalyaAgent', () => {
  let agent: MalyaAgent;

  beforeEach(() => {
    agent = new MalyaAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('malya');
  });

  it('should process add-idea message', async () => {
    const message = createTestMessage('add-idea', {
      title: 'New idea',
      description: 'An interesting idea',
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.idea_id).toBeDefined();
    expect(result.data?.message).toBe('Ідею додано');
  });
});

describe('KazkarAgent', () => {
  let agent: KazkarAgent;

  beforeEach(() => {
    agent = new KazkarAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('kazkar');
  });

  it('should process create-story message', async () => {
    const message = createTestMessage('create-story', {
      title: 'Test Story',
      content: 'Once upon a time...',
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.story_id).toBeDefined();
    expect(result.data?.message).toBe('Легенду створено');
  });
});

describe('KalendarAgent', () => {
  let agent: KalendarAgent;

  beforeEach(() => {
    agent = new KalendarAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('kalendar');
  });

  it('should process schedule_event message', async () => {
    const message = createTestMessage('schedule_event', {
      time: '2026-03-01T10:00:00Z',
      description: 'Team meeting',
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.description).toBe('Team meeting');
    expect(result.data?.message).toBe('Подію заплановано');
  });
});

describe('GalleryAgent', () => {
  let agent: GalleryAgent;

  beforeEach(() => {
    agent = new GalleryAgent(createMockState(), createMockEnv() as any);
  });

  it('should return health on GET /health', async () => {
    const req = new Request('https://agent/health');
    const res = await agent.fetch(req);
    const body = await res.json() as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.agent).toBe('gallery');
  });

  it('should process upload message', async () => {
    const message = createTestMessage('upload', {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    });
    const result = await agent.handleMessage(message);

    expect(result.success).toBe(true);
    expect(result.data?.filename).toBe('photo.jpg');
    expect(result.data?.message).toBe('Файл завантажено');
  });
});
