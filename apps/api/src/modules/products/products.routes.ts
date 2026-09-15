import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthEnv } from '../../middleware/auth';
import { ProductService } from './products.service';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  unit: z.enum(['unit', 'kg']).optional(),
  price: z.number().positive(),
  stockQuantity: z.number().min(0),
  category: z.string().max(100).optional()
});

const updateProductSchema = createProductSchema.partial();

const restockSchema = z.object({
  quantity: z.number().positive()
});

export const productRoutes = new Hono<AuthEnv>();
const service = new ProductService();

productRoutes.use('*', authMiddleware);

productRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const search = c.req.query('search') ?? undefined;
  const category = c.req.query('category') ?? undefined;
  const sortBy = c.req.query('sortBy') as any;
  const sortDir = c.req.query('sortDir') as any;
  const result = await service.list(tenantId, { page, limit, search, category, sortBy, sortDir });
  return c.json({ success: true, message: 'Products loaded', ...result });
});

productRoutes.get('/categories', async (c) => {
  const tenantId = c.get('tenantId');
  const categories = await service.listCategories(tenantId);
  return c.json({ success: true, message: 'Categories loaded', data: categories });
});

productRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const product = await service.findById(tenantId, c.req.param('id'));
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
  return c.json({ success: true, message: 'Product loaded', data: product });
});

productRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId');
  const body = createProductSchema.parse(await c.req.json());
  const product = await service.create(tenantId, body);
  return c.json({ success: true, message: 'Product created', data: product }, 201);
});

productRoutes.put('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const body = updateProductSchema.parse(await c.req.json());
  const product = await service.update(tenantId, c.req.param('id'), body);
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
  return c.json({ success: true, message: 'Product updated', data: product });
});

productRoutes.post('/:id/restock', async (c) => {
  const tenantId = c.get('tenantId');
  const body = restockSchema.parse(await c.req.json());
  const product = await service.restock(tenantId, c.req.param('id'), body.quantity);
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
  return c.json({ success: true, message: 'Stock updated', data: product });
});

productRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const product = await service.remove(tenantId, c.req.param('id'));
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
  return c.json({ success: true, message: 'Product deleted', data: product });
});
