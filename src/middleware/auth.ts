/**
 * Authentication Middleware
 * Validates incoming requests and enforces security policies
 */

/**
 * Create authentication middleware
 * Currently: passthrough (implement real JWT/token validation later)
 */
export const createAuthMiddleware = () => {
  return async (_c: any, next: any) => {
    // TODO: Implement real token verification
    // const token = c.req.header('Authorization');
    // if (!token?.startsWith('Bearer ')) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }

    await next();
  };
};
