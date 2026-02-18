import type { Context, Next } from 'hono';
import { CORS_ORIGINS } from '../lib/constants';
import { isAllowedOrigin } from '../lib/utils';

/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */
export async function cors(c: Context, next: Next): Promise<Response | void> {
  const origin = c.req.header('Origin') || '';

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    if (isAllowedOrigin(origin, CORS_ORIGINS)) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    return new Response(null, { status: 403 });
  }

  await next();

  // Add CORS headers to response
  if (isAllowedOrigin(origin, CORS_ORIGINS)) {
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}
