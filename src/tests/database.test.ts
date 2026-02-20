import { describe, it, expect, vi } from 'vitest';
import { initializeDatabase } from '../lib/db-init';
import { runMigrations } from '../lib/migrations';
import { logMetric, reportError, reportAgentStatus } from '../lib/monitoring';
import { verifyHealthChecks } from '../lib/health-check';
import type { Env } from '../types';

/**
 * Create mock Env with D1 database
 */
function createMockEnv(options?: { dbInitialized?: boolean }) {
  const runFn = vi.fn().mockResolvedValue({});
  const firstFn = vi.fn().mockResolvedValue(
    options?.dbInitialized ? { name: 'agent_states' } : null
  );
  const bindFn = vi.fn().mockReturnValue({ run: runFn, all: vi.fn().mockResolvedValue({ results: [] }) });

  return {
    CI_AGENT: {} as DurableObjectNamespace,
    PODIYA_AGENT: {} as DurableObjectNamespace,
    NASTRIY_AGENT: {} as DurableObjectNamespace,
    MALYA_AGENT: {} as DurableObjectNamespace,
    KAZKAR_AGENT: {} as DurableObjectNamespace,
    KALENDAR_AGENT: {} as DurableObjectNamespace,
    GALLERY_AGENT: {} as DurableObjectNamespace,
    CONFIG: {} as KVNamespace,
    AUTH_TOKENS: {} as KVNamespace,
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: bindFn,
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: runFn,
        first: firstFn,
      }),
    } as unknown as D1Database,
    FILES: {} as R2Bucket,
    ANALYTICS: {
      writeDataPoint: vi.fn(),
    } as unknown as AnalyticsEngineDataset,
    ENVIRONMENT: 'development' as const,
  } as unknown as Env;
}

describe('Database Initialization (db-init)', () => {
  it('should initialize database when not yet initialized', async () => {
    const env = createMockEnv({ dbInitialized: false });
    await initializeDatabase(env);
    expect(env.DB.prepare).toHaveBeenCalled();
  });

  it('should skip initialization when already initialized', async () => {
    const env = createMockEnv({ dbInitialized: true });
    await initializeDatabase(env);
    // Should call prepare once for the check, then return early
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
  });

  it('should handle missing DB gracefully', async () => {
    const env = { ...createMockEnv(), DB: undefined } as unknown as Env;
    await initializeDatabase(env);
    // Should return without error
  });
});

describe('Database Migrations', () => {
  it('should run migrations on fresh database', async () => {
    const env = createMockEnv();
    await runMigrations(env);
    expect(env.DB.prepare).toHaveBeenCalled();
  });

  it('should handle missing DB gracefully', async () => {
    const env = { ...createMockEnv(), DB: undefined } as unknown as Env;
    await runMigrations(env);
    // Should return without error
  });
});

describe('Monitoring', () => {
  it('should log metrics to analytics', async () => {
    const env = createMockEnv();
    await logMetric(env, 'test_metric', 42, { agent: 'ci' });
    expect(env.ANALYTICS.writeDataPoint).toHaveBeenCalled();
  });

  it('should handle missing analytics gracefully', async () => {
    const env = { ...createMockEnv(), ANALYTICS: undefined } as unknown as Env;
    await logMetric(env, 'test_metric', 42);
    // Should return without error
  });

  it('should report errors', async () => {
    const env = createMockEnv();
    await reportError(env, 'ci', new Error('test error'), 'test context');
    expect(env.ANALYTICS.writeDataPoint).toHaveBeenCalled();
  });

  it('should report agent status', async () => {
    const env = createMockEnv();
    await reportAgentStatus(env, 'ci', 100, 0);
    expect(env.ANALYTICS.writeDataPoint).toHaveBeenCalled();
  });
});

describe('Health Check', () => {
  it('should return true when all agents respond ok', async () => {
    const env = createMockEnv();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{"status":"ready"}', { status: 200 })
    ));

    const result = await verifyHealthChecks(env);
    expect(result).toBe(true);

    vi.unstubAllGlobals();
  });

  it('should return false when an agent returns 503', async () => {
    const env = createMockEnv();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{"error":"down"}', { status: 503 })
    ));

    const result = await verifyHealthChecks(env);
    expect(result).toBe(false);

    vi.unstubAllGlobals();
  });

  it('should return false when fetch throws', async () => {
    const env = createMockEnv();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await verifyHealthChecks(env);
    expect(result).toBe(false);

    vi.unstubAllGlobals();
  });
});
