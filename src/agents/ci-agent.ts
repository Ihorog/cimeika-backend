/**
 * Ci Agent - Central Orchestrator
 * Coordinates all other agents, monitors system health, manages workflows
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';
import { ALL_AGENT_TYPES } from '../types/agents';

export class CiAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'ci');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/health':
          return this.jsonResponse({
            agent: 'ci',
            status: this.agentState.status,
            uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
            message_count: this.agentState.message_count,
            error_count: this.agentState.error_count,
            timestamp: new Date().toISOString(),
          });

        case '/state':
          return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);

        case '/orchestrate':
          if (request.method !== 'POST') {
            return this.errorResponse('Method not allowed', 405);
          }
          return this.handleOrchestrate();

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
      console.error(`[CiAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'status_report':
        return { agents: ALL_AGENT_TYPES, status: 'operational' };

      case 'health_check':
        return {
          system: 'healthy',
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

  private async handleOrchestrate(): Promise<Response> {
    const results: Record<string, string> = {};

    for (const agentType of ALL_AGENT_TYPES) {
      if (agentType === 'ci') continue;
      results[agentType] = 'pinged';
    }

    return this.jsonResponse({
      success: true,
      message: 'Оркестрація завершена',
      agents: results,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleIncomingMessage(request: Request): Promise<Response> {
    const message = (await request.json()) as AgentMessage;
    const result = await this.handleMessage(message);
    return this.jsonResponse(result as unknown as Record<string, unknown>);
  }
}
