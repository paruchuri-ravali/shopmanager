import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  category: z.string().max(100).optional()
});

export const updateProductSchema = createProductSchema.partial();

