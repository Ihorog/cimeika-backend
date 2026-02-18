/**
 * Ci Agent - Центр керування та оркестрація
 * Module: CI (Central Intelligence)
 * Responsibility: System orchestration, agent coordination, health monitoring
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
      if (request.method === 'POST') {
        if (url.pathname.endsWith('/orchestrate')) {
          // Legacy endpoint for backward compatibility
          return this.jsonResponse({
            success: true,
            message: 'Оркестрація завершена',
            agents: (await this.listAgents()).agents,
            timestamp: new Date().toISOString()
          });
        }
        const message = await request.json() as AgentMessage;
        const response = await this.handleMessage(message);
        return this.jsonResponse(response as unknown as Record<string, unknown>);
      }

      if (request.method === 'GET') {
        if (url.pathname.endsWith('/status') || url.pathname.endsWith('/state')) {
          return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
        }
        if (url.pathname.endsWith('/health')) {
          return this.jsonResponse(await this.healthCheck());
        }
        if (url.pathname.endsWith('/agents')) {
          return this.jsonResponse(await this.listAgents());
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
    const { payload } = message;
    const action = payload?.action;

    switch (action) {
      case 'health-check':
      case 'health_check': // Legacy compatibility
        return await this.healthCheck();
      case 'list-agents':
        return await this.listAgents();
      case 'status_report': // Legacy compatibility
        return { agents: ['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'], status: 'operational' };
      case 'broadcast':
        return await this.broadcast(payload);
      case 'get-system-state':
        return await this.getSystemState();
      default:
        throw new Error(`Невідома дія: ${action}`);
    }
  }

  /**
   * System health check
   */
  private async healthCheck(): Promise<Record<string, any>> {
    return {
      agent: 'ci',
      status: this.agentState.status,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      message: 'Система працює'
    };
  }

  /**
   * List all registered agents and their status
   * NOTE: Currently returns hardcoded data. Will be replaced with real
   * Durable Object queries in B8 for actual agent status.
   */
  private async listAgents(): Promise<Record<string, any>> {
    const agents = [
      { id: 'ci', name: 'Ci', role: 'Центр керування та оркестрація', status: 'active' },
      { id: 'podiya', name: 'Подія', role: 'Майбутнє та події', status: 'ready' },
      { id: 'nastriy', name: 'Настрій', role: 'Емоційні стани та контекст', status: 'ready' },
      { id: 'malya', name: 'Маля', role: 'Ідеї та альтернативи', status: 'ready' },
      { id: 'kazkar', name: 'Казкар', role: 'Історії та наратив', status: 'ready' },
      { id: 'kalendar', name: 'Календар', role: 'Час та ритми', status: 'ready' },
      { id: 'gallery', name: 'Галерея', role: 'Візуальний архів', status: 'ready' }
    ];

    return { agents, count: agents.length, timestamp: new Date().toISOString() };
  }

  /**
   * Broadcast message to all agents
   */
  private async broadcast(payload: any): Promise<Record<string, any>> {
    // TODO: Implement real Durable Object inter-agent messaging in B8
    return {
      action: 'broadcast',
      status: 'queued',
      targets: ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'],
      payload,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get full system state
   */
  private async getSystemState(): Promise<Record<string, any>> {
    return {
      system: 'cimeika',
      version: '0.1.0',
      orchestrator: 'ci',
      status: 'initializing',
      agents: await this.listAgents(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
