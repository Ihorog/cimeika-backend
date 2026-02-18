/**
 * Cloudflare Workers environment bindings
 */
export interface Env {
  // Durable Objects - 7 Agents
  CI_AGENT: DurableObjectNamespace;
  PODIYA_AGENT: DurableObjectNamespace;
  NASTRIY_AGENT: DurableObjectNamespace;
  MALYA_AGENT: DurableObjectNamespace;
  KAZKAR_AGENT: DurableObjectNamespace;
  KALENDAR_AGENT: DurableObjectNamespace;
  GALLERY_AGENT: DurableObjectNamespace;

  // KV Namespaces
  CONFIG: KVNamespace;
  AUTH_TOKENS: KVNamespace;

  // D1 Database
  DB: D1Database;

  // R2 Bucket
  FILES: R2Bucket;

  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset;

  // Secrets
  GITHUB_TOKEN: string;
  OPENAI_API_KEY: string;
  HUGGINGFACE_TOKEN: string;
  VERCEL_TOKEN: string;

  // Environment
  ENVIRONMENT: string;
}

/**
 * Durable Object state interface
 */
export interface DurableObjectState {
  storage: DurableObjectStorage;
  id: DurableObjectId;
  waitUntil(promise: Promise<unknown>): void;
}
