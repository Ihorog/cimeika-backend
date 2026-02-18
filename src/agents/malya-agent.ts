import { BaseAgent } from './base-agent';
import type { MalyaAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now, generateId } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Malya Agent - Ideas and Creativity
 * Manages creative ideas and brainstorming
 */
export class MalyaAgent extends BaseAgent<MalyaAgentState> {
  protected getDefaultState(): MalyaAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      ideas: [],
      activeIdeaCount: 0,
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      const recentIdeas = this.agentState.ideas.filter(
        (i) => now() - i.timestamp < 604800000 // Last 7 days
      );

      const ideaScore = Math.min(1, recentIdeas.length / 20);
      const activeScore = Math.min(1, this.agentState.activeIdeaCount / 10);
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (ideaScore + activeScore + errorScore) / 3;
    } catch {
      return 0.5;
    }
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const score = await this.calculateScore();
      const status = score > 0.7 ? 'healthy' : score > 0.3 ? 'degraded' : 'unhealthy';
      const message =
        status === 'healthy'
          ? MESSAGES.HEALTH_OK
          : status === 'degraded'
          ? MESSAGES.HEALTH_DEGRADED
          : MESSAGES.HEALTH_DOWN;

      await this.logAnalytics('health_check', 'malya', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          totalIdeas: this.agentState.ideas.length,
          activeIdeas: this.agentState.activeIdeaCount,
        },
      };
    } catch (error) {
      console.error('Malya health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Add new idea
   * @param {string} content - Idea content
   * @returns {Promise<string>} Idea ID
   */
  async addIdea(content: string): Promise<string> {
    try {
      const ideaId = generateId();
      const idea = {
        id: ideaId,
        content,
        timestamp: now(),
      };

      const updatedIdeas = [...this.agentState.ideas, idea];
      // Keep only last 100 ideas
      if (updatedIdeas.length > 100) {
        updatedIdeas.shift();
      }

      await this.setState({
        ideas: updatedIdeas,
        activeIdeaCount: this.agentState.activeIdeaCount + 1,
        lastActivity: now(),
      });

      await this.logAnalytics('idea_added', 'malya', { ideaId });

      return ideaId;
    } catch (error) {
      console.error('Failed to add idea:', error);
      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'add_idea') {
        const ideaId = await this.addIdea(message.payload.content as string);

        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
          ideaId,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Malya message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
