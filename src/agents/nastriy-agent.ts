/**
 * Nastriy Agent - Mood Tracking
 * Tracks emotional states, analyzes patterns, provides context
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';

export class NastriyAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'nastriy');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'nastriy',
          status: this.agentState.status,
          uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
          message_count: this.agentState.message_count,
          error_count: this.agentState.error_count,
          timestamp: new Date().toISOString(),
        });
      }

      if (path === '/state') {
        return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
      }

      if (path === '/status') {
        return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
      }

      if (path === '/message' && method === 'POST') {
        return this.handleIncomingMessage(request);
      }

      if (path === '/' && method === 'POST') {
        return this.handleIncomingMessage(request);
      }

      if (path === '/current' && method === 'GET') {
        const entries = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 1'
        );
        const current = entries.length > 0 ? entries[0] : null;
        return this.jsonResponse({ current, message: 'Поточний настрій', timestamp: new Date().toISOString() });
      }

      if (path === '/track' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO mood_entries (id, mood, score, note) VALUES (?, ?, ?, ?)',
          [id, String(body.mood ?? ''), Number(body.score ?? 5), body.note ? String(body.note) : null]
        );
        return this.jsonResponse({ success: true, entry_id: id, message: 'Настрій зафіксовано', timestamp: new Date().toISOString() });
      }

      if (path === '/history' && method === 'GET') {
        const entries = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 30'
        );
        return this.jsonResponse({ entries, message: 'Історія настрою', timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NastriyAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'update_mood': {
        const { mood, score, note } = message.payload;
        return {
          success: true,
          mood,
          score,
          note,
          message: 'Настрій оновлено',
          timestamp: new Date().toISOString(),
        };
      }

      case 'get_mood':
        return {
          mood: 'neutral',
          score: 5,
          message: 'Поточний настрій',
          timestamp: new Date().toISOString(),
        };

      case 'track-mood': {
        const { mood, score, note } = message.payload;
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO mood_entries (id, mood, score, note) VALUES (?, ?, ?, ?)',
          [id, String(mood ?? ''), Number(score ?? 5), note ? String(note) : null]
        );
        return { success: true, entry_id: id, mood, score, message: 'Настрій зафіксовано', timestamp: new Date().toISOString() };
      }

      case 'get-current': {
        const entries = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 1'
        );
        const current = entries.length > 0 ? entries[0] : null;
        return { current, message: 'Поточний настрій', timestamp: new Date().toISOString() };
      }

      case 'get-history': {
        const limit = Number(message.payload?.limit ?? 30);
        const entries = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT ?',
          [limit]
        );
        return { entries, message: 'Історія настрою', timestamp: new Date().toISOString() };
      }

      default:
        return {
          received: true,
          action: action ?? 'unknown',
          timestamp: new Date().toISOString(),
        };
    }
  }

  private async handleIncomingMessage(request: Request): Promise<Response> {
    const message = (await request.json()) as AgentMessage;
    const result = await this.handleMessage(message);
    return this.jsonResponse(result as unknown as Record<string, unknown>);
  }
}
