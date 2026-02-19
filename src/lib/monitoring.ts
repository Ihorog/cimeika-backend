/**
 * Production monitoring utilities
 * Logs metrics, errors, agent status, and endpoint performance to Analytics Engine and KV.
 */

import type { Env, AgentType } from '../types';

/**
 * Writes a named metric data point to the Analytics Engine.
 */
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

/**
 * Reports an error for a specific agent to the Analytics Engine.
 */
export async function reportError(
  env: Env,
  agent: AgentType,
  error: Error,
  context?: string
): Promise<void> {
  await logMetric(env, 'error', 1, {
    agent,
    error_type: error.name,
    context: context ?? 'unknown'
  });

  console.error(`[${agent}] ${error.message}`, context);
}

/**
 * Reports uptime and error count for an agent.
 */
export async function reportAgentStatus(
  env: Env,
  agent: AgentType,
  uptime: number,
  errors: number
): Promise<void> {
  await logMetric(env, 'agent_uptime', uptime, { agent });
  await logMetric(env, 'agent_errors', errors, { agent });
}

/**
 * Records latency and status code for an API endpoint.
 */
export async function reportEndpointMetric(
  env: Env,
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
): Promise<void> {
  await logMetric(env, 'endpoint_request', 1, {
    endpoint,
    method,
    status: String(statusCode)
  });
  await logMetric(env, 'endpoint_duration_ms', durationMs, {
    endpoint,
    method
  });
}

/**
 * Sends a high-priority alert by logging to the Analytics Engine and KV.
 * In production the alert message is also written to the ALERTS KV key for
 * external polling.
 */
export async function alert(
  env: Env,
  message: string,
  severity: 'info' | 'warning' | 'critical' = 'warning'
): Promise<void> {
  await logMetric(env, 'alert', 1, { severity });

  console.warn(`[ALERT][${severity.toUpperCase()}] ${message}`);

  // Persist most recent alert to KV so it can be surfaced by the health endpoint
  try {
    await env.CONFIG.put(
      'last_alert',
      JSON.stringify({ message, severity, timestamp: new Date().toISOString() }),
      { expirationTtl: 86400 } // 24 h
    );
  } catch (error) {
    console.error('Failed to persist alert to KV:', error);
  }
}
