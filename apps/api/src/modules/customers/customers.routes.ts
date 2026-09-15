import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthEnv } from '../../middleware/auth';
import { CustomerService } from './customers.service';

const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(20).optional()
});

const updateCustomerSchema = createCustomerSchema.partial();

export const customerRoutes = new Hono<AuthEnv>();
const service = new CustomerService();

customerRoutes.use('*', authMiddleware);

customerRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const search = c.req.query('search') ?? undefined;
  const sortBy = c.req.query('sortBy') as any;
  const sortDir = c.req.query('sortDir') as any;
  const result = await service.list(tenantId, { page, limit, search, sortBy, sortDir });
  return c.json({ success: true, message: 'Customers loaded', ...result });
});

customerRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const customer = await service.findById(tenantId, c.req.param('id'));
  if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
  return c.json({ success: true, message: 'Customer loaded', data: customer });
});

customerRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const body = createCustomerSchema.parse(await c.req.json());
  const customer = await service.create(tenantId, body);
  return c.json({ success: true, message: 'Customer created', data: customer }, 201);
});

customerRoutes.put('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const body = updateCustomerSchema.parse(await c.req.json());
  const customer = await service.update(tenantId, c.req.param('id'), body);
  if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
  return c.json({ success: true, message: 'Customer updated', data: customer });
});

customerRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const customer = await service.remove(tenantId, c.req.param('id'));
  if (!customer) return c.json({ success: false, message: 'Customer not found' }, 404);
  return c.json({ success: true, message: 'Customer deleted', data: customer });
});
