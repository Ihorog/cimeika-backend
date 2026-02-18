/**
 * Health check endpoint verification
 * Tests all agent endpoints on startup
 */

import type { Env } from '../types';

export async function verifyHealthChecks(env: Env): Promise<boolean> {
  const agents = ['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery'];
  const baseUrl = env.ENVIRONMENT === 'production'
    ? 'https://cimeika-backend.workers.dev'
    : 'http://localhost:8787';
  let allHealthy = true;

  for (const agent of agents) {
    try {
      const url = `${baseUrl}/api/agents/${agent}/status`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Agent ${agent} health check failed: ${response.status}`);
        allHealthy = false;
      } else {
        console.log(`Agent ${agent} healthy`);
      }
    } catch (error) {
      console.error(`Cannot reach agent ${agent}:`, error);
      return false;
    }
  }

  return allHealthy;
}
