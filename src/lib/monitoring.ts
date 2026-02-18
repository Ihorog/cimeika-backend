/**
 * Production monitoring
 * Logs errors, performance metrics, agent status
 */

import type { Env, AgentType } from '../types';

export async function logMetric(
  env: Env,
  metric: string,
  value: number,
  tags?: Record<string, string>
): Promise<void> {
  if (!env.ANALYTICS) return;

  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [metric, ...(tags ? Object.values(tags) : [])],
      blobs: [JSON.stringify({ value, timestamp: new Date().toISOString() })],
      doubles: [value]
    });
  } catch (error) {
    console.error('Analytics write failed:', error);
  }
}

export async function reportError(
  env: Env,
  agent: AgentType,
  error: Error,
  context?: string
): Promise<void> {
  await logMetric(env, 'error', 1, {
    agent,
    error_type: error.name,
    context: context || 'unknown'
  });

  console.error(`[${agent}] ${error.message}`, context);
}

export async function reportAgentStatus(
  env: Env,
  agent: AgentType,
  uptime: number,
  errors: number
): Promise<void> {
  await logMetric(env, 'agent_uptime', uptime, { agent });
  await logMetric(env, 'agent_errors', errors, { agent });
}
