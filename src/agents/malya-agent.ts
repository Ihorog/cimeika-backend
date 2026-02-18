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

    try {
      switch (path) {
        case '/health':
          return this.jsonResponse({
            agent: 'malya',
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
      console.error(`[MalyaAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'add_idea': {
        const { content, tags, category } = message.payload;
        return {
          success: true,
          idea_id: message.id,
          content,
          tags,
          category,
          message: 'Ідею додано',
          timestamp: new Date().toISOString(),
        };
      }

      case 'list_ideas':
        return {
          ideas: [],
          message: 'Список ідей',
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
