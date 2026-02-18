/**
 * Extended Hono context variables
 */
export interface HonoVariables {
  validatedBody?: unknown;
  validatedQuery?: unknown;
  correlationId?: string;
}
