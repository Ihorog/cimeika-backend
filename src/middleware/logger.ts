/**
 * Request/Response Logging Middleware
 * Logs all HTTP requests with timing
 */

/**
 * Create logging middleware
 * Logs: method, path, status, response time
 */
export const createLoggerMiddleware = () => {
  return async (c: any, next: any) => {
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} ${status} ${duration}ms`);
  };
};
