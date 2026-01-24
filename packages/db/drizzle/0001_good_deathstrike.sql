CREATE TABLE "scheduled_post" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"synced_to_qstash" boolean DEFAULT false NOT NULL,
	"qstash_message_id" text,
	"tweet_id" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"posted_at" timestamp,
	"failed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "scheduled_post" ADD CONSTRAINT "scheduled_post_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_post_userId_idx" ON "scheduled_post" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_post_status_idx" ON "scheduled_post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_post_scheduledAt_idx" ON "scheduled_post" USING btree ("scheduled_at");