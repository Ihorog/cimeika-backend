/**
 * Kalendar Agent - Time & Scheduling
 * Manages calendar events, scheduling, and time-based triggers
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';

export class KalendarAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'kalendar');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'kalendar',
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

      if (path === '/events' && method === 'GET') {
        const events = await this.queryDB<Record<string, unknown>>(
          'SELECT * FROM calendar_events ORDER BY date ASC LIMIT 100'
        );
        return this.jsonResponse({ events, message: 'Календарні події', timestamp: new Date().toISOString() });
      }

      if (path === '/events' && method === 'POST') {
        const body = await request.json() as Record<string, unknown>;
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO calendar_events (id, title, date, type, description) VALUES (?, ?, ?, ?, ?)',
          [id, String(body.title ?? ''), String(body.date ?? ''), String(body.type ?? 'event'), body.description ? String(body.description) : null]
        );
        return this.jsonResponse({ success: true, event_id: id, message: 'Подію додано до календаря', timestamp: new Date().toISOString() });
      }

      if (path === '/today' && method === 'GET') {
        const today = new Date().toISOString().slice(0, 10);
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM calendar_events WHERE date = ? ORDER BY created_at ASC",
          [today]
        );
        return this.jsonResponse({ events, today, message: 'Події на сьогодні', timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KalendarAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'schedule_event': {
        const { time, description } = message.payload;
        return {
          success: true,
          event_id: message.id,
          time,
          description,
          message: 'Подію заплановано',
          timestamp: new Date().toISOString(),
        };
      }

      case 'list_schedule':
        return {
          schedule: [],
          message: 'Розклад',
          timestamp: new Date().toISOString(),
        };

      case 'add-event': {
        const { title, date, type, description } = message.payload;
        const id = crypto.randomUUID();
        await this.executeDB(
          'INSERT INTO calendar_events (id, title, date, type, description) VALUES (?, ?, ?, ?, ?)',
          [id, String(title ?? ''), String(date ?? ''), String(type ?? 'event'), description ? String(description) : null]
        );
        return { success: true, event_id: id, message: 'Подію додано до календаря', timestamp: new Date().toISOString() };
      }

      case 'get-today': {
        const today = new Date().toISOString().slice(0, 10);
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM calendar_events WHERE date = ? ORDER BY created_at ASC",
          [today]
        );
        return { events, today, message: 'Події на сьогодні', timestamp: new Date().toISOString() };
      }

      case 'get-upcoming': {
        const today = new Date().toISOString().slice(0, 10);
        const events = await this.queryDB<Record<string, unknown>>(
          "SELECT * FROM calendar_events WHERE date >= ? ORDER BY date ASC LIMIT 100",
          [today]
        );
        return { events, message: 'Майбутні події', timestamp: new Date().toISOString() };
      }

      case 'delete-event': {
        const { id } = message.payload;
        await this.executeDB('DELETE FROM calendar_events WHERE id = ?', [id]);
        return { success: true, message: 'Подію видалено', timestamp: new Date().toISOString() };
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
