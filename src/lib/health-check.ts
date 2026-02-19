/**
 * Health check utilities
 * Generates health status and verifies service deployment
 */

import type { Env } from '../types';

/** Shape returned by getHealthStatus */
export interface HealthStatus {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  version: string;
  environment: string;
  agents: number;
  checks: {
    kv: boolean;
    analytics: boolean;
    database: boolean;
  };
}

/** Shape returned by verifyDeployment */
export interface DeploymentVerification {
  ok: boolean;
  environment: string;
  agentsReachable: string[];
  agentsFailed: string[];
}

/**
 * Returns a health-status payload by probing available bindings.
 */
export async function getHealthStatus(env: Env): Promise<HealthStatus> {
  let kvOk = false;
  let analyticsOk = false;
  let databaseOk = false;

  // Probe KV
  try {
    await env.CONFIG.get('__health__');
    kvOk = true;
  } catch {
    kvOk = false;
  }

  // Probe Analytics Engine
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: ['health_check'],
      blobs: ['ping'],
      doubles: [1]
    });
    analyticsOk = true;
  } catch {
    analyticsOk = false;
  }

  // Probe D1 database
  try {
    await env.DB.prepare('SELECT 1').first();
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  // Analytics failures are non-critical (service still functions without metrics),
  // so analyticsOk is surfaced in `checks` but does not affect the overall status.
  const allOk = kvOk && databaseOk;
  const status: HealthStatus['status'] = allOk ? 'UP' : (kvOk || databaseOk ? 'DEGRADED' : 'DOWN');

  return {
    status,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: env.ENVIRONMENT,
    agents: 7,
    checks: {
      kv: kvOk,
      analytics: analyticsOk,
      database: databaseOk
    }
  };
}

/**
 * Verifies that all agent status endpoints are reachable.
 * Used after deployment to confirm services are up.
 */
export async function verifyDeployment(env: Env): Promise<DeploymentVerification> {
  const agents = ['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'];
  const baseUrl = env.ENVIRONMENT === 'production'
    ? 'https://cimeika-backend.workers.dev'
    : 'http://localhost:8787';

  const reachable: string[] = [];
  const failed: string[] = [];

  for (const agent of agents) {
    try {
      const response = await fetch(`${baseUrl}/api/agents/${agent}/status`);
      if (response.ok) {
        reachable.push(agent);
      } else {
        console.warn(`Agent ${agent} returned ${response.status}`);
        failed.push(agent);
      }
    } catch (error) {
      console.error(`Cannot reach agent ${agent}:`, error);
      failed.push(agent);
    }
  }

  return {
    ok: failed.length === 0,
    environment: env.ENVIRONMENT,
    agentsReachable: reachable,
    agentsFailed: failed
  };
}

/**
 * @deprecated Use verifyDeployment instead.
 */
export async function verifyHealthChecks(env: Env): Promise<boolean> {
  const result = await verifyDeployment(env);
  return result.ok;
}
