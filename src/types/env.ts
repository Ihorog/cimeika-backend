/**
 * Cloudflare Worker Environment Types
 * All bindings, namespaces, and secrets available to CIMEIKA Backend
 */

/**
 * Main environment interface for Cloudflare Worker
 * Contains all bindings defined in wrangler.jsonc
 */
export interface Env {
  // ============================================
  // DURABLE OBJECTS (7 Agents)
  // ============================================

  /** Ci Agent - Central orchestrator and control unit */
  CI_AGENT: DurableObjectNamespace;

  /** Podiya Agent - Event management and triggers */
  PODIYA_AGENT: DurableObjectNamespace;

  /** Nastriy Agent - Mood and emotional states */
  NASTRIY_AGENT: DurableObjectNamespace;

  /** Malya Agent - Ideas and innovation */
  MALYA_AGENT: DurableObjectNamespace;

  /** Kazkar Agent - Stories and narratives */
  KAZKAR_AGENT: DurableObjectNamespace;

  /** Kalendar Agent - Time and rhythms */
  KALENDAR_AGENT: DurableObjectNamespace;

  /** Gallery Agent - Images and media storage (R2) */
  GALLERY_AGENT: DurableObjectNamespace;

  // ============================================
  // KEY-VALUE STORAGE
  // ============================================

  /** Configuration and general settings storage */
  CONFIG: KVNamespace;

  /** Authentication tokens and session storage */
  AUTH_TOKENS: KVNamespace;

  // ============================================
  // DATABASE
  // ============================================

  /** Main SQLite database (D1) */
  DB: D1Database;

  // ============================================
  // FILE STORAGE
  // ============================================

  /** R2 bucket for file and image storage */
  FILES: R2Bucket;

  // ============================================
  // ANALYTICS
  // ============================================

  /** Cloudflare Analytics Engine for metrics */
  ANALYTICS: AnalyticsEngineDataset;

  // ============================================
  // SECRETS (Optional - may not be set)
  // ============================================

  /** GitHub Personal Access Token */
  GITHUB_TOKEN?: string;

  /** OpenAI API Key */
  OPENAI_API_KEY?: string;

  /** HuggingFace API Token */
  HUGGINGFACE_TOKEN?: string;

  /** Vercel API Token */
  VERCEL_TOKEN?: string;

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================

  /** Deployment environment */
  ENVIRONMENT: 'production' | 'staging' | 'development';
}
