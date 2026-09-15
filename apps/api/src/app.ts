import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/products/products.routes';
import { saleRoutes } from './modules/sales/sales.routes';
import { customerRoutes } from './modules/customers/customers.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { errorMiddleware } from './middleware/error';

export const createApp = (allowedOrigins: string[]) => {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const origin = c.req.header('Origin');
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Vary', 'Origin');
    }
    c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '600');

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204);
    }

    await next();
  });

  app.use('*', logger());

  app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

  app.route('/api/auth', authRoutes);
  app.route('/api/products', productRoutes);
  app.route('/api/sales', saleRoutes);
  app.route('/api/customers', customerRoutes);
  app.route('/api/dashboard', dashboardRoutes);

  app.onError(errorMiddleware);

  return app;
};
