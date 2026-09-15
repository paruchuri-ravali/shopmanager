import { Hono } from 'hono';
import { authMiddleware, type AuthEnv } from '../../middleware/auth';
import { DashboardService } from './dashboard.service';

export const dashboardRoutes = new Hono<AuthEnv>();
const service = new DashboardService();

dashboardRoutes.use('*', authMiddleware);

dashboardRoutes.get('/summary', async (c) => {
  const tenantId = c.get('tenantId');
  const data = await service.getSummary(tenantId);
  return c.json({ success: true, message: 'Dashboard summary', data });
});
