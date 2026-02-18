import { BaseAgent } from './base-agent';
import type { PodiyaAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now, generateId } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Podiya Agent - Events and Triggers
 * Manages events and event listeners
 */
export class PodiyaAgent extends BaseAgent<PodiyaAgentState> {
  protected getDefaultState(): PodiyaAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      events: [],
      activeListeners: 0,
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      // Score based on event activity and listener count
      const recentEvents = this.agentState.events.filter(
        (e) => now() - e.timestamp < 3600000 // Last hour
      );

      const activityScore = Math.min(1, recentEvents.length / 10);
      const listenerScore = Math.min(1, this.agentState.activeListeners / 5);
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (activityScore + listenerScore + errorScore) / 3;
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

      await this.logAnalytics('health_check', 'podiya', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          eventCount: this.agentState.events.length,
          activeListeners: this.agentState.activeListeners,
        },
      };
    } catch (error) {
      console.error('Podiya health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Create new event
   * @param {string} type - Event type
   * @param {Record<string, unknown>} data - Event data
   * @returns {Promise<string>} Event ID
   */
  async createEvent(type: string, data: Record<string, unknown>): Promise<string> {
    try {
      const eventId = generateId();
      const event = {
        id: eventId,
        type,
        timestamp: now(),
      };

      const updatedEvents = [...this.agentState.events, event];
      // Keep only last 100 events
      if (updatedEvents.length > 100) {
        updatedEvents.shift();
      }

      await this.setState({ events: updatedEvents, lastActivity: now() });
      await this.logAnalytics('event_created', 'podiya', { type, eventId });

      // Store in database
      await this.sqlExec(
        'INSERT INTO events (id, agent_from, agent_to, message_type, payload, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [eventId, 'podiya', 'system', type, JSON.stringify(data), 'medium', now()]
      );

      return eventId;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'create_event') {
        const eventId = await this.createEvent(
          message.payload.type as string,
          message.payload.data as Record<string, unknown>
        );

        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
          eventId,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Podiya message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
