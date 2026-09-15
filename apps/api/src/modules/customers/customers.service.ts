import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { customers, sales } from '../../db/schema';

export type CustomerListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'phone' | 'totalPurchases';
  sortDir?: 'asc' | 'desc';
};

const SORT_COLUMNS = {
  name: customers.name,
  phone: customers.phone,
  totalPurchases: customers.totalPurchases
} as const;

export class CustomerService {
  async list(tenantId: string, params: CustomerListParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;
    const search = params.search?.trim();

    const conditions = [eq(customers.tenantId, tenantId)];
    if (search) {
      conditions.push(or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`))!);
    }
    const whereClause = and(...conditions);

    const sortColumn = SORT_COLUMNS[params.sortBy ?? 'name'] ?? customers.name;
    const orderBy = params.sortDir === 'desc' ? desc(sortColumn) : asc(sortColumn);

    const [rows, countRows] = await Promise.all([
      db.select().from(customers).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(whereClause)
    ]);

    return { data: rows, total: Number(countRows[0]?.count ?? 0) };
  }

  async findById(tenantId: string, id: string) {
    const customerRows = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    const customer = customerRows[0];
    if (!customer) return null;

    const history = await db
      .select()
      .from(sales)
      .where(and(eq(sales.tenantId, tenantId), eq(sales.customerId, id)))
      .orderBy(desc(sales.saleDate))
      .limit(10);

    return { ...customer, recentSales: history };
  }

  async create(tenantId: string, input: { name: string; phone?: string }) {
    const [created] = await db.insert(customers).values({
      tenantId,
      name: input.name,
      phone: input.phone ?? null
    }).returning();

    return created;
  }

  async update(tenantId: string, id: string, input: Partial<{ name: string; phone?: string }>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.phone !== undefined) patch.phone = input.phone;

    const [updated] = await db
      .update(customers)
      .set(patch)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return updated ?? null;
  }

  async remove(tenantId: string, id: string) {
    const [removed] = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return removed ?? null;
  }
}
