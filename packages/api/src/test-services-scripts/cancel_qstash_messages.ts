/**
 * Cancel QStash Messages
 * 
 * Usage: bun src/cancel_qstash_messages.ts
 */

import { createDb, scheduledPost, eq } from "@repo/db";
import { QStashService } from "../services/qstash.service";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
    console.log("🛑 Cancelling QStash messages...\n");

    const db = createDb(process.env.DATABASE_URL!);

    const qstashService = new QStashService({
        token: process.env.QSTASH_TOKEN!,
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
        backendUrl: "http://65.2.9.16",
    });

    // Find all queued posts with QStash message IDs
    const queuedPosts = await db.query.scheduledPost.findMany({
        where: (post, { eq, and, isNotNull }) =>
            and(eq(post.status, "queued"), isNotNull(post.qstashMessageId)),
    });

    console.log(`Found ${queuedPosts.length} queued posts with QStash messages\n`);

    for (const post of queuedPosts) {
        if (post.qstashMessageId) {
            try {
                await qstashService.cancelMessage(post.qstashMessageId);
                console.log(`✅ Cancelled: ${post.id} (${post.qstashMessageId})`);

                // Update status to cancelled
                await db
                    .update(scheduledPost)
                    .set({ status: "cancelled" })
                    .where(eq(scheduledPost.id, post.id));
            } catch (error: any) {
                console.log(`⚠️  Already expired/cancelled: ${post.id} - ${error.message}`);
            }
        }
    }

    console.log("\n✅ Done! QStash should stop retrying now.");
}

main().catch(console.error);
