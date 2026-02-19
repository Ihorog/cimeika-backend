/**
 * Podiya Agent - Event Management
 * Handles event creation, tracking, and notification triggers
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';

export class PodiyaAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'podiya');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'podiya',
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

      if (path === '/list' && method === 'GET') {
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM events WHERE agent_from='podiya' ORDER BY created_at DESC LIMIT 100"
        );
        return this.jsonResponse({ events, timestamp: new Date().toISOString() });
      }

      if (path === '/create' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO events (id, agent_from, agent_to, message_type, payload, priority) VALUES (?, ?, ?, ?, ?, ?)',
          [id, 'podiya', 'podiya', String(body.type ?? 'event'), JSON.stringify(body), 'medium']
        );
        return this.jsonResponse({ success: true, event_id: id, message: 'Подію створено', timestamp: new Date().toISOString() });
      }

      if (path === '/upcoming' && method === 'GET') {
        const now = Date.now();
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM events WHERE agent_from='podiya' AND created_at > ? ORDER BY created_at ASC LIMIT 100",
          [now]
        );
        return this.jsonResponse({ events, timestamp: new Date().toISOString() });
      }

      if (path.startsWith('/delete/') && method === 'DELETE') {
        const eventId = path.slice('/delete/'.length);
        await this.executeDB('DELETE FROM events WHERE id = ? AND agent_from = ?', [eventId, 'podiya']);
        return this.jsonResponse({ success: true, message: 'Подію видалено', timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PodiyaAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'create_event': {
        const { type, data } = message.payload;
        return {
          success: true,
          event_id: message.id,
          type,
          data,
          message: 'Подію створено',
          timestamp: new Date().toISOString(),
        };
      }

      case 'list_events':
        return {
          events: [],
          message: 'Список подій',
          timestamp: new Date().toISOString(),
        };

      case 'create-event': {
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO events (id, agent_from, agent_to, message_type, payload, priority) VALUES (?, ?, ?, ?, ?, ?)',
          [id, 'podiya', 'podiya', String(message.payload.type ?? 'event'), JSON.stringify(message.payload.data ?? {}), 'medium']
        );
        return { success: true, event_id: id, message: 'Подію створено', timestamp: new Date().toISOString() };
      }

      case 'list-events': {
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM events WHERE agent_from='podiya' ORDER BY created_at DESC LIMIT 100"
        );
        return { events, message: 'Список подій', timestamp: new Date().toISOString() };
      }

      case 'delete-event': {
        const { id } = message.payload;
        await this.executeDB('DELETE FROM events WHERE id = ? AND agent_from = ?', [id, 'podiya']);
        return { success: true, message: 'Подію видалено', timestamp: new Date().toISOString() };
      }

      case 'get-upcoming': {
        const now = Date.now();
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM events WHERE agent_from='podiya' AND created_at > ? ORDER BY created_at ASC LIMIT 100",
          [now]
        );
        return { events, message: 'Майбутні події', timestamp: new Date().toISOString() };
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
