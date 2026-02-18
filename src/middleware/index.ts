/**
 * Middleware Exports
 * Central export point for all middleware
 */

export { createAuthMiddleware } from './auth';
export { createCorsMiddleware, cors } from './cors';
export { createErrorHandlerMiddleware } from './error-handler';
export { createLoggerMiddleware } from './logger';

// Legacy exports (for backward compatibility)
export { logging } from './logging';
export { rateLimit } from './rate-limit';
