import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export type AuthEnv = {
  Variables: {
    tenantId: string;
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verify(token, process.env.JWT_SECRET!, 'HS256');
    c.set('tenantId', String(payload.tenantId));
    c.set('userId', String(payload.userId));
    await next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
});
