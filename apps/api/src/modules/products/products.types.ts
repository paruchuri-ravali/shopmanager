export type Product = {
  id: string;
  tenantId: string;
  name: string;
  price: string;
  stockQuantity: number;
  category?: string | null;
};

