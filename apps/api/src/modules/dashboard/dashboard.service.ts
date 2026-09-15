import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../../db';
import { customers, products, sales } from '../../db/schema';

export class DashboardService {
  async getSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [daily, lowStock, topCustomers] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${sales.totalAmount}), 0)` })
        .from(sales)
        .where(and(eq(sales.tenantId, tenantId), gte(sales.saleDate, today))),
      db
        .select({ id: products.id, name: products.name, stockQuantity: products.stockQuantity })
        .from(products)
        .where(and(eq(products.tenantId, tenantId), sql`${products.stockQuantity} < 10`))
        .orderBy(products.stockQuantity),
      db
        .select({ id: customers.id, name: customers.name, phone: customers.phone, totalPurchases: customers.totalPurchases })
        .from(customers)
        .where(eq(customers.tenantId, tenantId))
        .orderBy(desc(customers.totalPurchases))
        .limit(5)
    ]);

    return {
      today: {
        sales: Number(daily[0]?.count ?? 0),
        revenue: Number(daily[0]?.revenue ?? 0)
      },
      lowStockAlerts: lowStock,
      topCustomers
    };
  }
}
