import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(20).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

