ALTER TABLE "sales" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "sales" SET "paid_amount" = "total_amount" WHERE "payment_status" = 'paid';