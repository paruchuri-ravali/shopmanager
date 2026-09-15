import { Hono } from 'hono';
import { ZodError } from 'zod';

export const errorMiddleware = (err: unknown, c: any) => {
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    }, 422);
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  if (message.includes('not found') || message.includes('Invalid') || message.includes('Insufficient stock')) {
    return c.json({ success: false, message }, 400);
  }

  console.error(err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
};
