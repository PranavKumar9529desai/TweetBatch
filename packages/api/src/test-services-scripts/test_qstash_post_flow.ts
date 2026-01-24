/**
 * Test Script: QStash Post Flow
 * 
 * This script tests the full QStash scheduling flow:
 * 1. Creates 5 scheduled posts for the first user in the database
 * 2. Pushes them to QStash with short delays
 * 3. Logs QStash message IDs for verification
 * 
 * Usage: bun src/test_qstash_post_flow.ts
 */

import { createDb, scheduledPost, eq } from "@repo/db";
import { QStashService } from "../services/qstash";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
    console.log("🚀 Starting QStash Post Flow Test...\n");

    // Validate environment
    const requiredEnvVars = [
        "DATABASE_URL",
        "QSTASH_TOKEN",
        "QSTASH_CURRENT_SIGNING_KEY",
        "QSTASH_NEXT_SIGNING_KEY",
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    // For local testing, we need a publicly accessible URL for QStash to call back
    // You can use ngrok or similar to expose your local server
    const backendUrl = "http://65.2.9.16";
    console.log(`📡 Backend URL: ${backendUrl}`);
    console.log("⚠️  Note: QStash needs a public URL to call back. Use ngrok for local testing.\n");

    // 1. Initialize DB
    const db = createDb(process.env.DATABASE_URL!);
    console.log("✅ Database connected\n");

    // 2. Find first user
    const firstUser = await db.query.user.findFirst();

    if (!firstUser) {
        console.error("❌ No users found in the database. Please create a user first.");
        return;
    }

    console.log(`👤 Found user: ${firstUser.name} (${firstUser.email})`);
    console.log(`   User ID: ${firstUser.id}\n`);

    // 3. Create 5 scheduled posts
    console.log("📝 Creating 5 scheduled posts...\n");

    const now = new Date();
    const posts: Array<{
        id: string;
        content: string;
        scheduledAt: Date;
        delaySeconds: number;
    }> = [];

    for (let i = 1; i <= 5; i++) {
        // Schedule each post 30 seconds apart for testing
        const scheduledAt = new Date(now.getTime() + i * 30 * 1000);
        const delaySeconds = i * 30;

        posts.push({
            id: randomUUID().slice(0, 16), // Short ID for readability
            content: `Test post #${i} - ${new Date().toISOString()}`,
            scheduledAt,
            delaySeconds,
        });
    }

    // Insert posts into database
    const insertedPosts = await db
        .insert(scheduledPost)
        .values(
            posts.map((p) => ({
                id: p.id,
                userId: firstUser.id,
                content: p.content,
                scheduledAt: p.scheduledAt,
                status: "pending",
                syncedToQStash: false,
                retryCount: 0,
            })),
        )
        .returning();

    console.log("✅ Created scheduled posts:");
    for (const post of insertedPosts) {
        console.log(`   - [${post.id}] "${post.content.slice(0, 40)}..." @ ${post.scheduledAt.toISOString()}`);
    }
    console.log();

    // 4. Initialize QStash Service
    const qstashService = new QStashService({
        token: process.env.QSTASH_TOKEN!,
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
        backendUrl,
    });

    console.log("🔗 Pushing posts to QStash...\n");

    // 5. Push to QStash
    try {
        const results = await qstashService.pushBatchToQStash(
            posts.map((p) => ({
                id: p.id,
                delaySeconds: p.delaySeconds,
            })),
        );

        console.log("✅ Successfully pushed to QStash:");
        for (const result of results) {
            console.log(`   - Post ${result.postId} → Message ID: ${result.messageId}`);
        }
        console.log();

        // 6. Update posts with QStash message IDs
        for (const result of results) {
            await db
                .update(scheduledPost)
                .set({
                    syncedToQStash: true,
                    qstashMessageId: result.messageId,
                    status: "queued",
                })
                .where(eq(scheduledPost.id, result.postId));
        }

        console.log("✅ Updated posts with QStash message IDs\n");

        console.log("📋 Summary:");
        console.log(`   - Created ${insertedPosts.length} scheduled posts`);
        console.log(`   - Pushed ${results.length} messages to QStash`);
        console.log(`   - First callback expected in ~30 seconds`);
        console.log(`   - Last callback expected in ~150 seconds (2.5 min)\n`);

        console.log("👀 Watch your backend logs for QStash callbacks!");
        console.log("   Endpoint: POST /api/qstash/post-tweet");
        console.log("   Each callback will contain: { postId: '...' }\n");

    } catch (error) {
        console.error("❌ Failed to push to QStash:", error);
        throw error;
    }
}

main().catch(console.error);
