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

    try {
      switch (path) {
        case '/health':
          return this.jsonResponse({
            agent: 'kalendar',
            status: this.agentState.status,
            uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
            message_count: this.agentState.message_count,
            error_count: this.agentState.error_count,
            timestamp: new Date().toISOString(),
          });

        case '/state':
          return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);

        case '/message':
          if (request.method !== 'POST') {
            return this.errorResponse('Method not allowed', 405);
          }
          return this.handleIncomingMessage(request);

        default:
          return this.errorResponse('Not found', 404);
      }
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
