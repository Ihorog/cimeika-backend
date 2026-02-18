import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { now } from '../lib/utils';

/**
 * Logging middleware
 * Logs requests to Analytics Engine
 */
export async function logging(c: Context, next: Next): Promise<void> {
  const env = c.env as Env;
  const startTime = now();

  await next();

  const duration = now() - startTime;

  try {
    // Log to Analytics Engine
    env.ANALYTICS.writeDataPoint({
      blobs: [
        c.req.method,
        c.req.path,
        String(c.res.status),
        c.req.header('CF-Connecting-IP') || 'unknown',
      ],
      doubles: [duration],
      indexes: [c.req.path],
    });
  } catch (error) {
    console.error('Logging error:', error);
  }
}
