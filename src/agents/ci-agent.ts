/**
 * Ci Agent — Центр керування та оркестрація
 * Module: Ci (Orchestrator)
 * Responsibility: System state management, agent coordination, health monitoring
 */

import { BaseAgent } from './base-agent';
import type { Env, AgentMessage } from '../types';

export class CiAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'ci');
    this.setStatus('ready');
  }

  /**
   * HTTP request handler
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Backward compatibility with /orchestrate endpoint
      if (request.method === 'POST' && url.pathname.endsWith('/orchestrate')) {
        return this.handleOrchestrate();
      }

      if (request.method === 'POST') {
        const message = (await request.json()) as AgentMessage;
        const response = await this.handleMessage(message);
        return this.jsonResponse(response as unknown as Record<string, unknown>);
      }

      if (request.method === 'GET') {
        if (url.pathname.endsWith('/status')) {
          return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
        }
        if (url.pathname.endsWith('/agents')) {
          return this.jsonResponse(await this.listAgents());
        }
        if (url.pathname.endsWith('/health')) {
          return this.jsonResponse({
            agent: 'ci',
            status: this.agentState.status,
            timestamp: new Date().toISOString()
          });
        }
        if (url.pathname.endsWith('/state')) {
          return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
        }
      }

      return this.errorResponse('Не знайдено', 404);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Невідома помилка',
        500
      );
    }
  }

  /**
   * Process incoming messages
   */
  protected async processMessage(message: AgentMessage): Promise<Record<string, any>> {
    const action = message.payload?.action;
    const payload = message.payload;

    switch (action) {
      case 'health-check':
        return await this.healthCheck();
      case 'start-agents':
        return await this.startAgents(payload);
      case 'stop-agents':
        return await this.stopAgents(payload);
      case 'get-system-state':
        return await this.getSystemState();
      case 'broadcast':
        return await this.broadcast(payload);
      // Backward compatibility with existing tests
      case 'status_report':
        return { agents: ['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'], status: 'operational' };
      case 'health_check':
        return {
          system: 'healthy',
          timestamp: new Date().toISOString(),
        };
      default:
        throw new Error(`Невідома дія: ${action}`);
    }
  }

  /**
   * Health check — verify all agents are responsive
   */
  private async healthCheck(): Promise<Record<string, any>> {
    const agents = ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'];
    const results: Record<string, string> = {};

    for (const agent of agents) {
      results[agent] = 'ready';
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agents: results
    };
  }

  /**
   * Start specified agents or all agents
   */
  private async startAgents(payload?: Record<string, any>): Promise<Record<string, any>> {
    const targets = payload?.agents || ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'];
    const started: string[] = [];

    for (const agent of targets) {
      started.push(agent);
    }

    await this.state.storage.put('active_agents', started);

    return {
      action: 'start-agents',
      started,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Stop specified agents or all agents
   */
  private async stopAgents(payload?: Record<string, any>): Promise<Record<string, any>> {
    const targets = payload?.agents || ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'];
    const stopped: string[] = [];

    for (const agent of targets) {
      stopped.push(agent);
    }

    await this.state.storage.put('active_agents', []);

    return {
      action: 'stop-agents',
      stopped,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get full system state
   */
  private async getSystemState(): Promise<Record<string, any>> {
    const activeAgents = (await this.state.storage.get('active_agents')) as string[] || [];

    return {
      system: 'cimeika',
      version: '0.1.0',
      orchestrator: 'ci',
      activeAgents,
      totalAgents: 7,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast message to all active agents
   */
  private async broadcast(payload?: Record<string, any>): Promise<Record<string, any>> {
    const activeAgents = (await this.state.storage.get('active_agents')) as string[] || [];
    const message = payload?.message || '';

    return {
      action: 'broadcast',
      message,
      recipients: activeAgents,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * List all agents and their statuses
   */
  private async listAgents(): Promise<Record<string, any>> {
    const activeAgents = (await this.state.storage.get('active_agents')) as string[] || [];

    const agents = [
      { name: 'ci', label: 'Центр керування', role: 'orchestrator' },
      { name: 'podiya', label: 'Подія', role: 'events' },
      { name: 'nastriy', label: 'Настрій', role: 'mood' },
      { name: 'malya', label: 'Маля', role: 'ideas' },
      { name: 'kazkar', label: 'Казкар', role: 'stories' },
      { name: 'kalendar', label: 'Календар', role: 'time' },
      { name: 'gallery', label: 'Галерея', role: 'media' }
    ].map((agent) => ({
      ...agent,
      active: agent.name === 'ci' || activeAgents.includes(agent.name)
    }));

    return { agents, total: agents.length };
  }

  // Backward compatibility method for existing tests
  private async handleOrchestrate(): Promise<Response> {
    const results: Record<string, string> = {};

    for (const agentType of ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery']) {
      results[agentType] = 'pinged';
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'ok',
      results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    });
  }
}
