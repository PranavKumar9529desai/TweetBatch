ALTER TABLE "scheduled_post" ALTER COLUMN "scheduled_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scheduled_post" ALTER COLUMN "status" SET DEFAULT 'draft';