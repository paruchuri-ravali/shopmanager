import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  boolean,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  shopName: varchar('shop_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email)
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => users.tenantId),
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 10 }).notNull().default('unit'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: decimal('stock_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (t) => ({
  tenantIdx: index('products_tenant_idx').on(t.tenantId)
}));

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => users.tenantId),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  totalPurchases: decimal('total_purchases', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
  tenantIdx: index('customers_tenant_idx').on(t.tenantId),
  phoneIdx: index('customers_phone_idx').on(t.phone)
}));

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => users.tenantId),
  customerId: uuid('customer_id').references(() => customers.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: varchar('payment_status', { length: 10 }).notNull().default('paid'),
  paymentMethod: varchar('payment_method', { length: 10 }),
  saleDate: timestamp('sale_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
  tenantIdx: index('sales_tenant_idx').on(t.tenantId),
  saleDateIdx: index('sales_date_idx').on(t.saleDate),
  tenantDateIdx: index('sales_tenant_date_idx').on(t.tenantId, t.saleDate)
}));

export const saleItems = pgTable('sale_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull()
}, (t) => ({
  saleIdx: index('sale_items_sale_idx').on(t.saleId),
  productIdx: index('sale_items_product_idx').on(t.productId)
}));

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  customers: many(customers),
  sales: many(sales)
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  saleItems: many(saleItems)
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] })
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales)
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems)
}));

