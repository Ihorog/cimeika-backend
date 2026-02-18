import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { MESSAGES } from '../lib/constants';

/**
 * Authentication middleware
 * Validates API tokens from AUTH_TOKENS KV namespace
 */
export async function auth(c: Context, next: Next): Promise<Response | void> {
  const env = c.env as Env;

  // Skip auth for health and public endpoints
  const publicPaths = ['/api/health', '/'];
  if (publicPaths.includes(c.req.path)) {
    return await next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: MESSAGES.ERROR_UNAUTHORIZED },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  try {
    // Validate token against AUTH_TOKENS KV
    const tokenData = await env.AUTH_TOKENS.get(token);

    if (!tokenData) {
      return c.json(
        { error: MESSAGES.ERROR_UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Store token data in context for later use
    c.set('auth', JSON.parse(tokenData));

    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json(
      { error: MESSAGES.ERROR_UNAUTHORIZED },
      { status: 401 }
    );
  }
}
