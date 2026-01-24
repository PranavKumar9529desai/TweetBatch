ALTER TABLE "account" ADD COLUMN "disconnected_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "disconnected_reason" text;