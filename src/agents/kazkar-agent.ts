/**
 * Kazkar Agent - Story Management
 * Manages stories, narratives, and storytelling
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';

export class KazkarAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'kazkar');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'kazkar',
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

      if (path === '/stories' && method === 'GET') {
        const stories = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM stories ORDER BY created_at DESC LIMIT 100'
        );
        return this.jsonResponse({ stories, message: 'Список легенд', timestamp: new Date().toISOString() });
      }

      if (path === '/stories' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const title = String(body.title ?? '').trim();
        const content = String(body.content ?? '').trim();
        if (!title || !content) {
          return this.errorResponse('Назва та зміст легенди є обов\'язковими', 400);
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        await this.executeDB(
          'INSERT INTO stories (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, title, content, body.tags ? String(body.tags) : null, now, now]
        );
        return this.jsonResponse({ success: true, story_id: id, message: 'Легенду створено', timestamp: new Date().toISOString() });
      }

      if (path.startsWith('/stories/') && method === 'GET') {
        const storyId = path.slice('/stories/'.length);
        const stories = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM stories WHERE id = ?',
          [storyId]
        );
        if (stories.length === 0) {
          return this.errorResponse('Легенду не знайдено', 404);
        }
        return this.jsonResponse({ story: stories[0], timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KazkarAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'create-story': {
        const { title, content, tags } = message.payload;
        const id = crypto.randomUUID();
        const now = Date.now();
        await this.executeDB(
          'INSERT INTO stories (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, String(title ?? ''), String(content ?? ''), tags ? String(tags) : null, now, now]
        );
        return { success: true, story_id: id, message: 'Легенду створено', timestamp: new Date().toISOString() };
      }

      case 'list-stories': {
        const stories = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM stories ORDER BY created_at DESC LIMIT 100'
        );
        return { stories, message: 'Список легенд', timestamp: new Date().toISOString() };
      }

      case 'get-story': {
        const { id } = message.payload;
        const stories = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM stories WHERE id = ?',
          [id]
        );
        const story = stories.length > 0 ? stories[0] : null;
        return { story, message: story ? 'Легенду знайдено' : 'Легенду не знайдено', timestamp: new Date().toISOString() };
      }

      case 'update-story': {
        const { id, content } = message.payload;
        const now = Date.now();
        await this.executeDB(
          'UPDATE stories SET content = ?, updated_at = ? WHERE id = ?',
          [String(content ?? ''), now, id]
        );
        return { success: true, message: 'Легенду оновлено', timestamp: new Date().toISOString() };
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
