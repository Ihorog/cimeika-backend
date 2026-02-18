import type { Env, DurableObjectState } from '../types/env';
import type { AgentMessage, HealthStatus, BaseAgentState } from '../types/agents';
import { generateId, now } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Abstract base class for all agents
 * Provides common functionality for KV, DB, R2, and Analytics operations
 */
export abstract class BaseAgent<TState extends BaseAgentState> {
  protected state: DurableObjectState;
  protected env: Env;
  protected agentState: TState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.agentState = this.getDefaultState();
  }

  /**
   * Get default state for agent (must be implemented by subclasses)
   * @returns {TState} Default state
   */
  protected abstract getDefaultState(): TState;

  /**
   * Calculate agent health score (must be implemented by subclasses)
   * @returns {Promise<number>} Score between 0 and 1
   */
  protected abstract calculateScore(): Promise<number>;

  /**
   * Check agent health (must be implemented by subclasses)
   * @returns {Promise<HealthStatus>} Health status
   */
  public abstract checkHealth(): Promise<HealthStatus>;

  /**
   * Initialize agent state from storage
   */
  protected async initialize(): Promise<void> {
    try {
      const stored = await this.state.storage.get<TState>('state');
      if (stored) {
        this.agentState = stored;
      } else {
        this.agentState = this.getDefaultState();
        await this.setState(this.agentState);
      }
    } catch (error) {
      console.error('Failed to initialize agent:', error);
      this.agentState = this.getDefaultState();
    }
  }

  /**
   * Update agent state in storage
   * @param {Partial<TState>} updates - State updates
   */
  protected async setState(updates: Partial<TState>): Promise<void> {
    try {
      this.agentState = { ...this.agentState, ...updates };
      await this.state.storage.put('state', this.agentState);
    } catch (error) {
      console.error('Failed to set state:', error);
      throw error;
    }
  }

  /**
   * Get value from KV namespace
   * @param {string} key - KV key
   * @param {KVNamespace} namespace - KV namespace (default: CONFIG)
   * @returns {Promise<string | null>} Value or null
   */
  protected async getKV(
    key: string,
    namespace: KVNamespace = this.env.CONFIG
  ): Promise<string | null> {
    try {
      return await namespace.get(key);
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in KV namespace
   * @param {string} key - KV key
   * @param {string} value - Value to store
   * @param {number} ttl - TTL in seconds (optional)
   * @param {KVNamespace} namespace - KV namespace (default: CONFIG)
   */
  protected async setKV(
    key: string,
    value: string,
    ttl?: number,
    namespace: KVNamespace = this.env.CONFIG
  ): Promise<void> {
    try {
      const options = ttl ? { expirationTtl: ttl } : undefined;
      await namespace.put(key, value, options);
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Execute SQL query on D1 database
   * @param {string} query - SQL query
   * @param {unknown[]} params - Query parameters
   * @returns {Promise<T | null>} Query result
   */
  protected async sql<T>(query: string, params: unknown[] = []): Promise<T | null> {
    try {
      const stmt = this.env.DB.prepare(query);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await bound.first<T>();
      return result;
    } catch (error) {
      console.error('SQL query error:', error);
      return null;
    }
  }

  /**
   * Execute SQL query and return all results
   * @param {string} query - SQL query
   * @param {unknown[]} params - Query parameters
   * @returns {Promise<T[]>} Query results
   */
  protected async sqlAll<T>(query: string, params: unknown[] = []): Promise<T[]> {
    try {
      const stmt = this.env.DB.prepare(query);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await bound.all<T>();
      return result.results || [];
    } catch (error) {
      console.error('SQL query all error:', error);
      return [];
    }
  }

  /**
   * Execute SQL command (INSERT, UPDATE, DELETE)
   * @param {string} query - SQL command
   * @param {unknown[]} params - Query parameters
   * @returns {Promise<boolean>} Success status
   */
  protected async sqlExec(query: string, params: unknown[] = []): Promise<boolean> {
    try {
      const stmt = this.env.DB.prepare(query);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      await bound.run();
      return true;
    } catch (error) {
      console.error('SQL exec error:', error);
      return false;
    }
  }

  /**
   * Store file in R2 bucket
   * @param {string} key - File key
   * @param {string | ArrayBuffer} data - File data
   * @param {Record<string, string>} metadata - Optional metadata
   * @returns {Promise<boolean>} Success status
   */
  protected async storeFile(
    key: string,
    data: string | ArrayBuffer,
    metadata?: Record<string, string>
  ): Promise<boolean> {
    try {
      const options = metadata ? { customMetadata: metadata } : undefined;
      await this.env.FILES.put(key, data, options);
      return true;
    } catch (error) {
      console.error(`R2 store error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve file from R2 bucket
   * @param {string} key - File key
   * @returns {Promise<R2ObjectBody | null>} File object or null
   */
  protected async getFile(key: string): Promise<R2ObjectBody | null> {
    try {
      return await this.env.FILES.get(key);
    } catch (error) {
      console.error(`R2 get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete file from R2 bucket
   * @param {string} key - File key
   * @returns {Promise<boolean>} Success status
   */
  protected async deleteFile(key: string): Promise<boolean> {
    try {
      await this.env.FILES.delete(key);
      return true;
    } catch (error) {
      console.error(`R2 delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Log analytics event
   * @param {string} event - Event name
   * @param {string} agent - Agent name
   * @param {Record<string, unknown>} data - Event data
   */
  protected async logAnalytics(
    event: string,
    agent: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Log to Analytics Engine
      this.env.ANALYTICS.writeDataPoint({
        blobs: [event, agent],
        doubles: [now()],
        indexes: [event],
      });

      // Also store in D1 for querying
      const id = generateId();
      const dataJson = data ? JSON.stringify(data) : null;
      await this.sqlExec(
        'INSERT INTO analytics (id, event, agent, data, timestamp) VALUES (?, ?, ?, ?, ?)',
        [id, event, agent, dataJson, now()]
      );
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }

  /**
   * Send message to another agent
   * @param {AgentMessage} message - Message to send
   * @returns {Promise<boolean>} Success status
   */
  protected async sendMessage(message: AgentMessage): Promise<boolean> {
    try {
      // Store message in events table
      await this.sqlExec(
        'INSERT INTO events (id, agent_from, agent_to, message_type, payload, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          message.id,
          message.from,
          message.to,
          message.type,
          JSON.stringify(message.payload),
          message.priority,
          message.timestamp,
        ]
      );

      // Log analytics
      await this.logAnalytics('message_sent', message.from, {
        to: message.to,
        type: message.type,
      });

      return true;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  }

  /**
   * Process incoming message (can be overridden by subclasses)
   * @param {AgentMessage} message - Incoming message
   * @returns {Promise<Response>} Response
   */
  protected async processMessage(_message: AgentMessage): Promise<Response> {
    // Default implementation - subclasses should override
    await this.setState({
      lastActivity: now(),
      messageCount: this.agentState.messageCount + 1,
    } as Partial<TState>);

    return Response.json({
      success: true,
      message: MESSAGES.SUCCESS,
    });
  }

  /**
   * Handle HTTP fetch request (Durable Object handler)
   * @param {Request} request - HTTP request
   * @returns {Promise<Response>} HTTP response
   */
  async fetch(request: Request): Promise<Response> {
    try {
      // Initialize on first request
      if (!this.agentState.initialized) {
        await this.initialize();
        await this.setState({ initialized: true } as Partial<TState>);
      }

      const url = new URL(request.url);
      const path = url.pathname;

      // Health check endpoint
      if (path === '/health') {
        const health = await this.checkHealth();
        return Response.json(health);
      }

      // Message endpoint
      if (path === '/message' && request.method === 'POST') {
        const messageData = (await request.json()) as AgentMessage;
        return await this.processMessage(messageData);
      }

      // State endpoint
      if (path === '/state' && request.method === 'GET') {
        return Response.json(this.agentState);
      }

      return Response.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: 404 }
      );
    } catch (error) {
      console.error('Agent fetch error:', error);
      await this.setState({
        errorCount: this.agentState.errorCount + 1,
      } as Partial<TState>);

      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
