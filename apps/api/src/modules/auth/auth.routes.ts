import { Hono } from 'hono';
import { z, ZodError } from 'zod';
import { db } from '../../db';
import { users } from '../../db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signToken, signRefreshToken } from '../../utils/jwt';
import { authMiddleware, type AuthEnv } from '../../middleware/auth';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  shopName: z.string().trim().min(1, 'Shop name is required').max(255)
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

export const authRoutes = new Hono<AuthEnv>();

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255).optional(),
  shopName: z.string().trim().min(1, 'Shop name is required').max(255).optional(),
  email: z.string().trim().email('Invalid email').optional()
});

const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join('.') || 'form'}: ${issue.message}`)
    .join('\n');

authRoutes.post('/register', async (c) => {
  try {
    const body = registerSchema.parse(await c.req.json());
    const tenantId = crypto.randomUUID();
    const passwordHash = await hashPassword(body.password);

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      return c.json({ success: false, message: 'Email already exists' }, 409);
    }

    const [created] = await db
      .insert(users)
      .values({
        tenantId,
        name: body.name,
        email: body.email,
        passwordHash,
        shopName: body.shopName
      })
      .returning();

    const accessToken = await signToken({ userId: created.id, tenantId: created.tenantId });
    const refreshToken = await signRefreshToken({ userId: created.id, tenantId: created.tenantId });

    return c.json({
      success: true,
      message: 'Account created',
      data: {
        user: {
          id: created.id,
          tenantId: created.tenantId,
          name: created.name,
          email: created.email,
          shopName: created.shopName
        },
        accessToken,
        refreshToken
      }
    }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ success: false, message: 'Validation error', errors: error.issues }, 400);
    }
    throw error;
  }
});

authRoutes.post('/login', async (c) => {
  try {
    const body = loginSchema.parse(await c.req.json());
    const rows = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    const user = rows[0];

    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const ok = await comparePassword(body.password, user.passwordHash);
    if (!ok) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const accessToken = await signToken({ userId: user.id, tenantId: user.tenantId });
    const refreshToken = await signRefreshToken({ userId: user.id, tenantId: user.tenantId });

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          email: user.email,
          shopName: user.shopName
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ success: false, message: 'Validation error', errors: error.issues }, 400);
    }
    throw error;
  }
});

authRoutes.put('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = updateProfileSchema.parse(await c.req.json());

    if (body.email) {
      const existing = await db
        .select()
        .from(users)
        .where(and(eq(users.email, body.email), ne(users.id, userId)))
        .limit(1);
      if (existing.length > 0) {
        return c.json({ success: false, message: 'Email already exists' }, 409);
      }
    }

    const [updated] = await db.update(users).set(body).where(eq(users.id, userId)).returning();
    if (!updated) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Profile updated',
      data: {
        user: {
          id: updated.id,
          tenantId: updated.tenantId,
          name: updated.name,
          email: updated.email,
          shopName: updated.shopName
        }
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ success: false, message: 'Validation error', errors: error.issues }, 400);
    }
    throw error;
  }
});
