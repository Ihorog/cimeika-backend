import { BaseAgent } from './base-agent';
import type { NastriyAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Nastriy Agent - Mood Tracking
 * Tracks and analyzes mood states
 */
export class NastriyAgent extends BaseAgent<NastriyAgentState> {
  protected getDefaultState(): NastriyAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      currentMood: 'neutral',
      moodHistory: [],
      moodScore: 0.5,
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      // Score based on mood stability and recent activity
      const recentMoods = this.agentState.moodHistory.filter(
        (m) => now() - m.timestamp < 86400000 // Last 24 hours
      );

      const activityScore = Math.min(1, recentMoods.length / 10);
      const moodScore = this.agentState.moodScore;
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (activityScore + moodScore + errorScore) / 3;
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

      await this.logAnalytics('health_check', 'nastriy', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          currentMood: this.agentState.currentMood,
          moodScore: this.agentState.moodScore,
          historyCount: this.agentState.moodHistory.length,
        },
      };
    } catch (error) {
      console.error('Nastriy health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Update current mood
   * @param {string} mood - New mood
   * @param {number} score - Mood score (0-1)
   */
  async updateMood(mood: string, score: number): Promise<void> {
    try {
      const moodEntry = { mood, timestamp: now() };
      const updatedHistory = [...this.agentState.moodHistory, moodEntry];

      // Keep only last 50 mood entries
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }

      await this.setState({
        currentMood: mood,
        moodScore: score,
        moodHistory: updatedHistory,
        lastActivity: now(),
      });

      await this.logAnalytics('mood_updated', 'nastriy', { mood, score });
    } catch (error) {
      console.error('Failed to update mood:', error);
      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'update_mood') {
        await this.updateMood(
          message.payload.mood as string,
          message.payload.score as number
        );

        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
          currentMood: this.agentState.currentMood,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Nastriy message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
