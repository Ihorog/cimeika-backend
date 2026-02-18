import { BaseAgent } from './base-agent';
import type { KalendarAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now, generateId } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Kalendar Agent - Time and Rhythms
 * Manages scheduling and time-based operations
 */
export class KalendarAgent extends BaseAgent<KalendarAgentState> {
  protected getDefaultState(): KalendarAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      scheduledEvents: [],
      timezone: 'Europe/Kiev',
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      const upcomingEvents = this.agentState.scheduledEvents.filter(
        (e) => e.time > now()
      );

      const scheduleScore = Math.min(1, upcomingEvents.length / 20);
      const activityScore = now() - this.agentState.lastActivity < 3600000 ? 1 : 0.5;
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (scheduleScore + activityScore + errorScore) / 3;
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

      await this.logAnalytics('health_check', 'kalendar', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          scheduledEvents: this.agentState.scheduledEvents.length,
          timezone: this.agentState.timezone,
        },
      };
    } catch (error) {
      console.error('Kalendar health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Schedule new event
   * @param {number} time - Event timestamp
   * @param {string} description - Event description
   * @returns {Promise<string>} Event ID
   */
  async scheduleEvent(time: number, description: string): Promise<string> {
    try {
      const eventId = generateId();
      const event = {
        id: eventId,
        time,
        description,
      };

      const updatedEvents = [...this.agentState.scheduledEvents, event].sort(
        (a, b) => a.time - b.time
      );

      // Keep only future events and last 100
      const futureEvents = updatedEvents.filter((e) => e.time > now());
      const limitedEvents = futureEvents.slice(0, 100);

      await this.setState({
        scheduledEvents: limitedEvents,
        lastActivity: now(),
      });

      await this.logAnalytics('event_scheduled', 'kalendar', { eventId, time, description });

      return eventId;
    } catch (error) {
      console.error('Failed to schedule event:', error);
      throw error;
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'schedule_event') {
        const eventId = await this.scheduleEvent(
          message.payload.time as number,
          message.payload.description as string
        );

        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
          eventId,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Kalendar message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
