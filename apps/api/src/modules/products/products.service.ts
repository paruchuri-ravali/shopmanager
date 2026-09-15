import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../../db';
import { products } from '../../db/schema';

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'name' | 'category' | 'price' | 'stockQuantity';
  sortDir?: 'asc' | 'desc';
};

const SORT_COLUMNS = {
  name: products.name,
  category: products.category,
  price: products.price,
  stockQuantity: products.stockQuantity
} as const;

export class ProductService {
  async list(tenantId: string, params: ProductListParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;
    const search = params.search?.trim();
    const category = params.category?.trim();

    const conditions = [eq(products.tenantId, tenantId)];
    if (search) conditions.push(ilike(products.name, `%${search}%`));
    if (category) conditions.push(eq(products.category, category));
    const whereClause = and(...conditions);

    const sortColumn = SORT_COLUMNS[params.sortBy ?? 'name'] ?? products.name;
    const orderBy = params.sortDir === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause)
    ]);

    return { data: rows, total: Number(countRows[0]?.count ?? 0) };
  }

  async listCategories(tenantId: string) {
    const rows = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    return rows.map((r) => r.category).filter((c): c is string => Boolean(c)).sort();
  }

  async findById(tenantId: string, id: string) {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(tenantId: string, input: { name: string; unit?: 'unit' | 'kg'; price: number; stockQuantity: number; category?: string }) {
    const [created] = await db.insert(products).values({
      tenantId,
      name: input.name,
      unit: input.unit ?? 'unit',
      price: String(input.price),
      stockQuantity: String(input.stockQuantity),
      category: input.category ?? null
    }).returning();

    return created;
  }

  async update(tenantId: string, id: string, input: Partial<{ name: string; unit: 'unit' | 'kg'; price: number; stockQuantity: number; category?: string; isActive: boolean }>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.price !== undefined) patch.price = String(input.price);
    if (input.stockQuantity !== undefined) patch.stockQuantity = String(input.stockQuantity);
    if (input.category !== undefined) patch.category = input.category;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    patch.updatedAt = new Date();

    const [updated] = await db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    return updated ?? null;
  }

  async restock(tenantId: string, id: string, quantity: number) {
    const [updated] = await db
      .update(products)
      .set({ stockQuantity: sql<number>`${products.stockQuantity} + ${quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    return updated ?? null;
  }

  async remove(tenantId: string, id: string) {
    const [removed] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    return removed ?? null;
  }
}
