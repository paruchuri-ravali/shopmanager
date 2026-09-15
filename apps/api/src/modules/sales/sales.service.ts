import { and, asc, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '../../db';
import { customers, products, saleItems, sales } from '../../db/schema';

export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type SaleListParams = {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  paymentStatus?: 'paid' | 'credit';
  paymentMethod?: 'cash' | 'upi';
  sortBy?: 'saleDate' | 'customerName' | 'totalAmount';
  sortDir?: 'asc' | 'desc';
};

const SORT_COLUMNS = {
  saleDate: sales.saleDate,
  customerName: customers.name,
  totalAmount: sales.totalAmount
} as const;

export class SalesService {
  async list(tenantId: string, params: SaleListParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;
    const search = params.search?.trim();

    const conditions = [eq(sales.tenantId, tenantId)];
    if (params.from) conditions.push(gte(sales.saleDate, new Date(params.from)));
    if (params.to) conditions.push(lte(sales.saleDate, new Date(params.to)));
    if (search) conditions.push(ilike(customers.name, `%${search}%`));
    if (params.paymentStatus) conditions.push(eq(sales.paymentStatus, params.paymentStatus));
    if (params.paymentMethod) conditions.push(eq(sales.paymentMethod, params.paymentMethod));
    const whereClause = and(...conditions);

    const sortColumn = SORT_COLUMNS[params.sortBy ?? 'saleDate'] ?? sales.saleDate;
    const orderBy = params.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const selection = {
      id: sales.id,
      tenantId: sales.tenantId,
      customerId: sales.customerId,
      customerName: customers.name,
      totalAmount: sales.totalAmount,
      paidAmount: sales.paidAmount,
      paymentStatus: sales.paymentStatus,
      paymentMethod: sales.paymentMethod,
      saleDate: sales.saleDate,
      createdAt: sales.createdAt
    };

    const [rows, countRows] = await Promise.all([
      db
        .select(selection)
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(whereClause)
    ]);

    return { data: rows, total: Number(countRows[0]?.count ?? 0) };
  }

  async findById(tenantId: string, id: string) {
    const saleRows = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.tenantId, tenantId)))
      .limit(1);

    const sale = saleRows[0];
    if (!sale) return null;

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    return { ...sale, items };
  }

  async recordPayment(tenantId: string, id: string, amount: number, method: 'cash' | 'upi') {
    const rows = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.tenantId, tenantId)))
      .limit(1);

    const sale = rows[0];
    if (!sale) return null;

    const total = Number(sale.totalAmount);
    const alreadyPaid = Number(sale.paidAmount);
    const pending = total - alreadyPaid;

    if (amount > pending + 0.005) {
      throw new Error(`Amount exceeds pending balance of ${pending.toFixed(2)}`);
    }

    const newPaid = Math.min(total, alreadyPaid + amount);
    const [updated] = await db
      .update(sales)
      .set({
        paidAmount: String(newPaid),
        paymentMethod: method,
        paymentStatus: newPaid >= total - 0.005 ? 'paid' : 'credit'
      })
      .where(and(eq(sales.id, id), eq(sales.tenantId, tenantId)))
      .returning();

    return updated ?? null;
  }

  async create(tenantId: string, input: { customerId?: string; paymentStatus?: 'paid' | 'credit'; paymentMethod?: 'cash' | 'upi'; items: SaleItemInput[] }) {
    return db.transaction(async (tx) => {
      for (const item of input.items) {
        const productRows = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId)))
          .limit(1);

        const product = productRows[0];
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (Number(product.stockQuantity) < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}"`);
        }
      }

      const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const isCredit = input.paymentStatus === 'credit';
      const [sale] = await tx.insert(sales).values({
        tenantId,
        customerId: input.customerId ?? null,
        totalAmount: String(total),
        paidAmount: isCredit ? '0' : String(total),
        paymentStatus: input.paymentStatus ?? 'paid',
        paymentMethod: isCredit ? null : (input.paymentMethod ?? 'cash')
      }).returning();

      await tx.insert(saleItems).values(
        input.items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          subtotal: String(item.quantity * item.unitPrice)
        }))
      );

      for (const item of input.items) {
        await tx
          .update(products)
          .set({ stockQuantity: sql<number>`${products.stockQuantity} - ${item.quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId)));
      }

      if (input.customerId) {
        const customerRows = await tx
          .select()
          .from(customers)
          .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, tenantId)))
          .limit(1);

        if (customerRows[0]) {
          await tx
            .update(customers)
            .set({ totalPurchases: sql<number>`${customers.totalPurchases} + ${total}` })
            .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, tenantId)));
        }
      }

      return sale;
    });
  }
}
