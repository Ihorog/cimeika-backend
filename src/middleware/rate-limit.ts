import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { RATE_LIMIT_PER_MINUTE, MESSAGES } from '../lib/constants';
import { now } from '../lib/utils';

/**
 * Rate limiting middleware
 * Limits requests per IP address using KV storage
 */
export async function rateLimit(c: Context, next: Next): Promise<Response | void> {
  const env = c.env as Env;

  // Get client IP
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  const rateLimitKey = `ratelimit:${ip}`;

  try {
    // Get current request count
    const currentData = await env.CONFIG.get(rateLimitKey);
    const current = currentData ? JSON.parse(currentData) : { count: 0, resetAt: now() + 60000 };

    // Reset if time window expired
    if (now() > current.resetAt) {
      current.count = 0;
      current.resetAt = now() + 60000; // 1 minute window
    }

    // Check if limit exceeded
    if (current.count >= RATE_LIMIT_PER_MINUTE) {
      return c.json(
        {
          error: MESSAGES.ERROR_RATE_LIMIT,
          retryAfter: Math.ceil((current.resetAt - now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((current.resetAt - now()) / 1000)),
          },
        }
      );
    }

    // Increment counter
    current.count++;
    await env.CONFIG.put(rateLimitKey, JSON.stringify(current), {
      expirationTtl: 120, // 2 minutes TTL
    });

    // Add rate limit headers
    c.res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_PER_MINUTE));
    c.res.headers.set('X-RateLimit-Remaining', String(RATE_LIMIT_PER_MINUTE - current.count));
    c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    await next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request through
    await next();
  }
}
