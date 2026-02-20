/**
 * Request/Response Logging Middleware
 * Logs all HTTP requests with timing and reports metrics to Analytics Engine
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { reportEndpointMetric } from '../lib/monitoring';

/**
 * Create logging middleware
 * Logs: method, path, status, response time
 * Reports per-request metrics via reportEndpointMetric
 */
export const createLoggerMiddleware = () => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} ${status} ${duration}ms`);

    // Report per-request metrics to Analytics Engine (non-blocking)
    c.executionCtx.waitUntil(
      reportEndpointMetric(c.env, path, method, status, duration)
    );
  };
};
