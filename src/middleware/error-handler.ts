/**
 * Global Error Handler Middleware
 * Catches and formats all unhandled errors
 */

/**
 * Create global error handler
 * Returns consistent error JSON response
 */
export const createErrorHandlerMiddleware = () => {
  return async (c: any, next: any) => {
    try {
      await next();
    } catch (error) {
      console.error('Unhandled error:', error);

      const message =
        error instanceof Error ? error.message : 'Internal server error';

      return c.json(
        {
          error: true,
          message: 'Помилка сервера',
          details: message
        },
        500
      );
    }
  };
};
