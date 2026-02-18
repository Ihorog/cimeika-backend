/**
 * CORS Middleware Configuration
 * Handles cross-origin requests
 */

import { cors as honoCors } from 'hono/cors';
import type { Context, Next } from 'hono';
import { CORS_ORIGINS } from '../lib/constants';
import { isAllowedOrigin } from '../lib/utils';

/**
 * Create CORS middleware
 * Allow: localhost:3000/3001, cimeika.com.ua domains
 */
export const createCorsMiddleware = () => {
  return honoCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://cimeika.com.ua',
      'https://*.cimeika.com.ua'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400
  });
};

/**
 * Legacy CORS middleware (for backward compatibility)
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
