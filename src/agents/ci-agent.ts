import { BaseAgent } from './base-agent';
import type { CiAgentState, HealthStatus } from '../types/agents';
import { now } from '../lib/utils';
import { MESSAGES, HEALTH_CHECK_INTERVAL } from '../lib/constants';

/**
 * Ci Agent - Orchestrator and System Monitor
 * Coordinates all other agents and monitors system health
 */
export class CiAgent extends BaseAgent<CiAgentState> {
  protected getDefaultState(): CiAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      activeAgents: ['podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'],
      systemHealth: 'healthy',
      lastHealthCheck: now(),
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      // Calculate system health score based on:
      // 1. Number of active agents
      // 2. Error rate
      // 3. Time since last health check

      const activeScore = this.agentState.activeAgents.length / 6; // 6 managed agents
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 100);
      const timeScore = now() - this.agentState.lastHealthCheck < HEALTH_CHECK_INTERVAL ? 1 : 0.5;

      const score = (activeScore + errorScore + timeScore) / 3;
      return Math.min(1, Math.max(0, score));
    } catch {
      return 0;
    }
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const score = await this.calculateScore();
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let statusMessage = MESSAGES.HEALTH_OK;

      if (score < 0.3) {
        status = 'unhealthy';
        statusMessage = MESSAGES.HEALTH_DOWN;
      } else if (score < 0.7) {
        status = 'degraded';
        statusMessage = MESSAGES.HEALTH_DEGRADED;
      }

      await this.setState({
        systemHealth: status,
        lastHealthCheck: now(),
      });

      // Log health check to analytics
      await this.logAnalytics('health_check', 'ci', { score, status });

      return {
        status,
        message: statusMessage,
        timestamp: now(),
        score,
        details: {
          activeAgents: this.agentState.activeAgents,
          errorCount: this.agentState.errorCount,
        },
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Orchestrate all agents - check their health
   * @returns {Promise<Record<AgentType, HealthStatus>>} Health status of all agents
   */
  async orchestrateAgents(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};

    try {
      // Check health of all managed agents
      for (const agentType of this.agentState.activeAgents) {
        try {
          // In real implementation, would call each agent's health endpoint
          results[agentType] = {
            status: 'healthy',
            message: MESSAGES.HEALTH_OK,
            timestamp: now(),
            score: 0.9,
          };
        } catch (error) {
          console.error(`Failed to check ${agentType}:`, error);
          results[agentType] = {
            status: 'unhealthy',
            message: MESSAGES.ERROR_GENERIC,
            timestamp: now(),
            score: 0,
          };
        }
      }

      await this.logAnalytics('orchestration', 'ci', {
        checkedAgents: this.agentState.activeAgents.length,
      });
    } catch (error) {
      console.error('Orchestration failed:', error);
    }

    return results;
  }
}
