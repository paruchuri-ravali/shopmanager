import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthEnv } from '../../middleware/auth';
import { SalesService } from './sales.service';

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  paymentStatus: z.enum(['paid', 'credit']).optional(),
  paymentMethod: z.enum(['cash', 'upi']).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive()
  })).min(1)
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['cash', 'upi'])
});

export const saleRoutes = new Hono<AuthEnv>();
const service = new SalesService();

saleRoutes.use('*', authMiddleware);

saleRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  const result = await service.list(tenantId, {
    page: Number(c.req.query('page') ?? 1),
    limit: Number(c.req.query('limit') ?? 20),
    search: c.req.query('search') ?? undefined,
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
    paymentStatus: c.req.query('paymentStatus') as any,
    paymentMethod: c.req.query('paymentMethod') as any,
    sortBy: c.req.query('sortBy') as any,
    sortDir: c.req.query('sortDir') as any
  });
  return c.json({ success: true, message: 'Sales loaded', ...result });
});

saleRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const sale = await service.findById(tenantId, c.req.param('id'));
  if (!sale) return c.json({ success: false, message: 'Sale not found' }, 404);
  return c.json({ success: true, message: 'Sale loaded', data: sale });
});

saleRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const body = createSaleSchema.parse(await c.req.json());
  const sale = await service.create(tenantId, body);
  return c.json({ success: true, message: 'Sale created', data: sale }, 201);
});

saleRoutes.post('/:id/payments', async (c) => {
  const tenantId = c.get('tenantId');
  try {
    const body = recordPaymentSchema.parse(await c.req.json());
    const sale = await service.recordPayment(tenantId, c.req.param('id'), body.amount, body.method);
    if (!sale) return c.json({ success: false, message: 'Sale not found' }, 404);
    return c.json({ success: true, message: 'Payment recorded', data: sale });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Amount exceeds')) {
      return c.json({ success: false, message: error.message }, 400);
    }
    throw error;
  }
});
