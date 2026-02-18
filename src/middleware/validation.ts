/**
 * Validation middleware for request bodies
 */
import type { Context, Next } from 'hono';
import type { z } from 'zod';
import type { HonoVariables } from '../types/hono';
import { MESSAGES } from '../lib/constants';

/**
 * Error codes for better client-side handling
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_FORMAT: 'INVALID_FORMAT',
};

/**
 * Validation error response type
 */
export interface ValidationError {
  error: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  correlationId?: string;
}

/**
 * Create validation middleware for a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context<{ Variables: HonoVariables }>, next: Next): Promise<Response | void> => {
    try {
      // Parse request body
      const body = await c.req.json().catch(() => {
        throw new Error('INVALID_JSON');
      });

      // Validate against schema
      const result = schema.safeParse(body);

      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return c.json<ValidationError>(
          {
            error: MESSAGES.ERROR_INVALID_INPUT,
            code: ERROR_CODES.VALIDATION_ERROR,
            details,
            correlationId: c.get('correlationId'),
          },
          { status: 400 }
        );
      }

      // Store validated data in context
      c.set('validatedBody', result.data);
      await next();
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_JSON') {
        return c.json<ValidationError>(
          {
            error: 'Невірний формат JSON',
            code: ERROR_CODES.INVALID_JSON,
            correlationId: c.get('correlationId'),
          },
          { status: 400 }
        );
      }

      console.error('Validation middleware error:', error);
      return c.json(
        {
          error: MESSAGES.ERROR_GENERIC,
          correlationId: c.get('correlationId'),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate query parameters
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context<{ Variables: HonoVariables }>, next: Next): Promise<Response | void> => {
    try {
      const query = Object.fromEntries(
        new URL(c.req.url).searchParams.entries()
      );

      const result = schema.safeParse(query);

      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return c.json<ValidationError>(
          {
            error: MESSAGES.ERROR_INVALID_INPUT,
            code: ERROR_CODES.VALIDATION_ERROR,
            details,
            correlationId: c.get('correlationId'),
          },
          { status: 400 }
        );
      }

      c.set('validatedQuery', result.data);
      await next();
    } catch (error) {
      console.error('Query validation error:', error);
      return c.json(
        {
          error: MESSAGES.ERROR_GENERIC,
          correlationId: c.get('correlationId'),
        },
        { status: 500 }
      );
    }
  };
}
