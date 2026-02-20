/**
 * Malya Agent - Idea Management
 * Manages ideas, brainstorming, and alternative proposals
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';

export class MalyaAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'malya');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'malya',
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

      if (path === '/ideas' && method === 'GET') {
        const ideas = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM ideas ORDER BY created_at DESC LIMIT 100"
        );
        return this.jsonResponse({ ideas, message: 'Список ідей', timestamp: new Date().toISOString() });
      }

      if (path === '/ideas' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const title = String(body.title ?? '').trim();
        if (!title) {
          return this.errorResponse('Назва ідеї не може бути порожньою', 400);
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        await this.executeDB(
          'INSERT INTO ideas (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, title, body.description ? String(body.description) : null, 'new', now, now]
        );
        return this.jsonResponse({ success: true, idea_id: id, message: 'Ідею додано', timestamp: new Date().toISOString() });
      }

      if (path.startsWith('/ideas/') && method === 'PUT') {
        const ideaId = path.slice('/ideas/'.length);
        const body = await request.json() as Record<string, unknown>;
        const now = Date.now();
        await this.executeDB(
          'UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?',
          [String(body.status ?? 'active'), now, ideaId]
        );
        return this.jsonResponse({ success: true, message: 'Статус ідеї оновлено', timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MalyaAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'add-idea': {
        const { title, description } = message.payload;
        const id = crypto.randomUUID();
        const now = Date.now();
        await this.executeDB(
          'INSERT INTO ideas (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, String(title ?? ''), description ? String(description) : null, 'new', now, now]
        );
        return { success: true, idea_id: id, message: 'Ідею додано', timestamp: new Date().toISOString() };
      }

      case 'list-ideas': {
        const status = message.payload?.status;
        let sql = 'SELECT * FROM ideas ORDER BY created_at DESC LIMIT 100';
        const params: unknown[] = [];
        if (status) {
          sql = 'SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC LIMIT 100';
          params.push(status);
        }
        const ideas = await this.queryDB<Record<string, unknown>>(sql, params.length ? params : undefined);
        return { ideas, message: 'Список ідей', timestamp: new Date().toISOString() };
      }

      case 'update-idea': {
        const { id, status } = message.payload;
        const now = Date.now();
        await this.executeDB(
          'UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?',
          [String(status ?? 'active'), now, id]
        );
        return { success: true, message: 'Статус ідеї оновлено', timestamp: new Date().toISOString() };
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
