import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import type { HonoVariables } from '../types/hono';
import { now, generateId } from '../lib/utils';

/**
 * Logging middleware
 * Logs requests to Analytics Engine with correlation tracking
 */
export async function logging(c: Context<{ Bindings: Env; Variables: HonoVariables }>, next: Next): Promise<void> {
  const env = c.env as Env;
  const startTime = now();

  // Generate correlation ID for request tracking
  const correlationId = c.req.header('X-Correlation-ID') || generateId();
  c.set('correlationId', correlationId);

  // Set correlation ID in response headers
  c.res.headers.set('X-Correlation-ID', correlationId);

  // Log request start
  console.log(`[${correlationId}] ${c.req.method} ${c.req.path} - Request started`);

  await next();

  const duration = now() - startTime;
  const status = c.res.status;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  // Log request completion
  const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
  console.log(`[${correlationId}] ${level}: ${c.req.method} ${c.req.path} - ${status} (${duration}ms)`);

  try {
    // Log to Analytics Engine
    env.ANALYTICS.writeDataPoint({
      blobs: [
        c.req.method,
        c.req.path,
        String(status),
        ip,
        userAgent,
        correlationId,
      ],
      doubles: [duration, status],
      indexes: [c.req.path, correlationId],
    });
  } catch (error) {
    console.error(`[${correlationId}] Logging error:`, error);
  }
}
