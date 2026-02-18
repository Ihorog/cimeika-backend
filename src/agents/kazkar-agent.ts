import { BaseAgent } from './base-agent';
import type { KazkarAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now, generateId } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Kazkar Agent - Stories and Narratives
 * Manages storytelling and narrative content
 */
export class KazkarAgent extends BaseAgent<KazkarAgentState> {
  protected getDefaultState(): KazkarAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      stories: [],
      totalStories: 0,
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      const recentStories = this.agentState.stories.filter(
        (s) => now() - s.timestamp < 604800000 // Last 7 days
      );

      const storyScore = Math.min(1, recentStories.length / 10);
      const totalScore = Math.min(1, this.agentState.totalStories / 50);
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (storyScore + totalScore + errorScore) / 3;
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

      await this.logAnalytics('health_check', 'kazkar', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          storyCount: this.agentState.stories.length,
          totalStories: this.agentState.totalStories,
        },
      };
    } catch (error) {
      console.error('Kazkar health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Add new story
   * @param {string} title - Story title
   * @param {string} content - Story content
   * @returns {Promise<string>} Story ID
   */
  async addStory(title: string, content: string): Promise<string> {
    try {
      const storyId = generateId();
      const story = {
        id: storyId,
        title,
        timestamp: now(),
      };

      const updatedStories = [...this.agentState.stories, story];
      // Keep only last 50 stories in state
      if (updatedStories.length > 50) {
        updatedStories.shift();
      }

      await this.setState({
        stories: updatedStories,
        totalStories: this.agentState.totalStories + 1,
        lastActivity: now(),
      });

      // Store full story content in KV
      await this.setKV(`story:${storyId}`, JSON.stringify({ title, content, timestamp: now() }));

      await this.logAnalytics('story_added', 'kazkar', { storyId, title });

      return storyId;
    } catch (error) {
      console.error('Failed to add story:', error);
      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'add_story') {
        const storyId = await this.addStory(
          message.payload.title as string,
          message.payload.content as string
        );

        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
          storyId,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Kazkar message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
