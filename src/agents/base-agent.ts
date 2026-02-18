/**
 * Base Agent Class
 * Abstract base class for all 7 CIMEIKA agents
 *
 * Provides:
 * - Message handling framework
 * - State management with persistence
 * - Storage access (KV, D1, R2)
 * - Analytics logging
 * - Error handling and recovery
 */

import type { Env } from '../types/env';
import type {
  AgentType,
  AgentStatus,
  AgentMessage,
  AgentResponse,
  AgentState
} from '../types/agents';
import { AGENT_NAMES } from '../types/agents';

/**
 * Abstract base class for all agents
 * Subclasses must implement:
 * - fetch() - HTTP request handler
 * - processMessage() - Message processing logic
 */
export abstract class BaseAgent {
  /** Durable Object state for persistent storage */
  protected state: DurableObjectState;

  /** Cloudflare Worker environment bindings */
  protected env: Env;

  /** Agent type identifier */
  protected agentType: AgentType;

  /** Current agent runtime state */
  protected agentState: AgentState;

  /** Timestamp when agent was instantiated */
  protected startTime: number;

  /**
   * Initialize agent with Durable Object state and environment
   * @param state - Durable Object state
   * @param env - Cloudflare Worker environment
   * @param agentType - Type identifier for this agent
   */
  constructor(
    state: DurableObjectState,
    env: Env,
    agentType: AgentType
  ) {
    this.state = state;
    this.env = env;
    this.agentType = agentType;
    this.startTime = Date.now();

    this.agentState = {
      id: state.id.toString(),
      name: AGENT_NAMES[agentType],
      type: agentType,
      status: 'initializing',
      version: '0.1.0',
      uptime_seconds: 0,
      message_count: 0,
      error_count: 0,
      last_activity: new Date().toISOString(),
      next_check: new Date(Date.now() + 60000).toISOString()
    };
  }

  // ============================================
  // ABSTRACT METHODS
  // ============================================

  /**
   * Main HTTP request handler — must be implemented by each agent subclass
   * @param request - Incoming HTTP request
   * @returns HTTP response
   */
  abstract fetch(request: Request): Promise<Response>;

  /**
   * Process an incoming inter-agent message — must be implemented by subclass
   * @param message - The agent message to process
   * @returns Processed data as a record
   */
  protected abstract processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>>;

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Handle an incoming message with full error handling and state management.
   * Wraps processMessage() with try/catch, counters, status transitions, analytics.
   * @param message - The agent message to handle
   * @returns Agent response with success/failure and data
   */
  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    try {
      this.agentState.message_count++;
      this.agentState.last_activity = new Date().toISOString();
      this.setStatus('processing');

      const data = await this.processMessage(message);

      this.setStatus('ready');
      return {
        success: true,
        data,
        agent: this.agentType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.agentState.error_count++;
      this.setStatus('error');

      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${this.agentState.name}] Error:`, errorMsg);

      try {
        await this.logAnalytics('error', {
          agent: this.agentType,
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
      } catch (_analyticsError) {
        console.error('Analytics logging failed:', _analyticsError);
      }

      return {
        success: false,
        error: errorMsg,
        agent: this.agentType,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current agent state with calculated uptime
   * @returns Current agent state snapshot
   */
  getState(): AgentState {
    this.agentState.uptime_seconds = Math.floor(
      (Date.now() - this.startTime) / 1000
    );
    return { ...this.agentState };
  }

  // ============================================
  // STORAGE: KV
  // ============================================

  /**
   * Get a JSON-parsed value from KV namespace
   * @param key - KV key to retrieve
   * @returns Parsed value or null
   */
  protected async getFromKV<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.env.CONFIG.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error(`KV get failed for key '${key}':`, error);
      return null;
    }
  }

  /**
   * Save a JSON value to KV namespace
   * @param key - KV key
   * @param value - Value to store (will be JSON.stringified)
   * @param expirationTtl - Optional TTL in seconds
   */
  protected async saveToKV(
    key: string,
    value: Record<string, unknown>,
    expirationTtl?: number
  ): Promise<void> {
    try {
      const options: KVNamespacePutOptions = {};
      if (expirationTtl !== undefined) {
        options.expirationTtl = expirationTtl;
      }
      await this.env.CONFIG.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.error(`KV put failed for key '${key}':`, error);
    }
  }

  /**
   * Delete a key from KV namespace
   * @param key - KV key to delete
   */
  protected async deleteFromKV(key: string): Promise<void> {
    try {
      await this.env.CONFIG.delete(key);
    } catch (error) {
      console.error(`KV delete failed for key '${key}':`, error);
    }
  }

  // ============================================
  // STORAGE: D1 DATABASE
  // ============================================

  /**
   * Run a SELECT query on D1 database
   * @param sql - SQL query string
   * @param params - Bind parameters
   * @returns Array of result rows
   */
  protected async queryDB<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    try {
      const stmt = this.env.DB.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;
      const result = await bound.all<T>();
      return result.results ?? [];
    } catch (error) {
      console.error('DB query failed:', error);
      throw error;
    }
  }

  /**
   * Run an INSERT/UPDATE/DELETE statement on D1 database
   * @param sql - SQL statement string
   * @param params - Bind parameters
   * @returns D1 run result
   */
  protected async executeDB(
    sql: string,
    params?: unknown[]
  ): Promise<D1Result> {
    try {
      const stmt = this.env.DB.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;
      return await bound.run();
    } catch (error) {
      console.error('DB execute failed:', error);
      throw error;
    }
  }

  // ============================================
  // STORAGE: R2
  // ============================================

  /**
   * Upload a file to R2 bucket
   * @param key - R2 object key (path)
   * @param body - File content
   * @param contentType - MIME type (default: application/octet-stream)
   */
  protected async uploadToR2(
    key: string,
    body: ReadableStream | ArrayBuffer | string,
    contentType?: string
  ): Promise<void> {
    try {
      await this.env.FILES.put(key, body, {
        httpMetadata: {
          contentType: contentType ?? 'application/octet-stream'
        }
      });
    } catch (error) {
      console.error(`R2 upload failed for key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Download a file from R2 bucket
   * @param key - R2 object key (path)
   * @returns File content as ArrayBuffer or null if not found
   */
  protected async downloadFromR2(key: string): Promise<ArrayBuffer | null> {
    try {
      const object = await this.env.FILES.get(key);
      return object ? await object.arrayBuffer() : null;
    } catch (error) {
      console.error(`R2 download failed for key '${key}':`, error);
      return null;
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Write an event to Cloudflare Analytics Engine
   * @param event - Event name
   * @param data - Event data
   */
  protected async logAnalytics(
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.env.ANALYTICS) return;

    try {
      this.env.ANALYTICS.writeDataPoint({
        indexes: [this.agentType, event],
        blobs: [JSON.stringify(data)],
        doubles: [Date.now()]
      });
    } catch (error) {
      console.error('Analytics write failed:', error);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Set the agent's operational status
   * @param status - New status
   */
  protected setStatus(status: AgentStatus): void {
    this.agentState.status = status;
  }

  /**
   * Create a JSON HTTP response
   * @param data - Response body
   * @param status - HTTP status code (default: 200)
   * @returns Response object
   */
  protected jsonResponse(
    data: Record<string, unknown>,
    status: number = 200
  ): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Create an error HTTP response
   * @param message - Error message
   * @param status - HTTP status code (default: 500)
   * @returns Response object
   */
  protected errorResponse(
    message: string,
    status: number = 500
  ): Response {
    return this.jsonResponse({ error: message }, status);
  }
}
