import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive()
  })).min(1)
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

