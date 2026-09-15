ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET DATA TYPE numeric(12, 3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 3);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(10) DEFAULT 'unit' NOT NULL;