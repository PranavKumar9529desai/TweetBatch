import { Hono } from "hono";
import { createDb } from "@repo/db";
import { QStashService } from "../services/qstash";
import { ScheduledPostService } from "../services/scheduled-post";
import { TwitterService } from "../services/twitter";
import type { Bindings } from "../types";

/**
 * QStash Webhook Route
 * Handles callbacks from QStash to post scheduled tweets.
 */
export const qstashWebhookRoute = new Hono<{ Bindings: Bindings }>();

/**
 * POST /post-tweet
 * Called by QStash when it's time to post a scheduled tweet.
 */
qstashWebhookRoute.post("/post-tweet", async (c) => {
    const env = c.env;

    // 1. Verify QStash signature
    const signature = c.req.header("upstash-signature");
    if (!signature) {
        console.error("Missing QStash signature header");
        return c.json({ error: "Missing signature" }, 401);
    }

    const body = await c.req.text();

    const qstashService = new QStashService({
        token: env.QSTASH_TOKEN,
        currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
        backendUrl: env.BACKEND_URL,
    });

    const isValid = await qstashService.verifySignature(signature, body);
    if (!isValid) {
        console.error("Invalid QStash signature");
        return c.json({ error: "Invalid signature" }, 401);
    }

    // 2. Parse the request body
    let postId: string;
    try {
        const parsed = JSON.parse(body);
        postId = parsed.postId;
    } catch (e) {
        console.error("Failed to parse request body:", e);
        return c.json({ error: "Invalid request body" }, 400);
    }

    if (!postId) {
        console.error("Missing postId in request body");
        return c.json({ error: "Missing postId" }, 400);
    }

    console.log(`Processing scheduled post: ${postId}`);

    // 3. Initialize services
    const db = createDb(env.DATABASE_URL);
    const postService = new ScheduledPostService(db);
    const twitterService = new TwitterService(
        db,
        env.TWITTER_CLIENT_ID,
        env.TWITTER_CLIENT_SECRET
    );

    // 4. Fetch the post
    const post = await postService.getScheduledPost(postId);

    if (!post) {
        console.log(`Post ${postId} not found - may have been deleted`);
        // Return 200 to prevent QStash from retrying for a deleted post
        return c.json({ status: "skipped", reason: "post_not_found" });
    }

    // 5. Check post status - skip if already processed
    if (post.status === "posted") {
        console.log(`Post ${postId} already posted`);
        return c.json({ status: "skipped", reason: "already_posted" });
    }

    if (post.status === "cancelled") {
        console.log(`Post ${postId} was cancelled`);
        return c.json({ status: "skipped", reason: "cancelled" });
    }

    if (post.status === "failed" && post.retryCount >= 5) {
        console.log(`Post ${postId} exceeded max retries`);
        return c.json({ status: "skipped", reason: "max_retries_exceeded" });
    }

    // 6. Post the tweet
    try {
        console.log(`Posting tweet for user ${post.userId}: "${post.content.substring(0, 50)}..."`);

        const tweetData = await twitterService.postTweet(post.userId, post.content);

        // 7. Mark as posted
        await postService.markAsPosted(postId, tweetData.id);

        console.log(`Successfully posted tweet ${tweetData.id} for post ${postId}`);

        return c.json({
            status: "success",
            tweetId: tweetData.id,
        });
    } catch (error: any) {
        console.error(`Failed to post tweet for post ${postId}:`, error);

        // Classify the error
        const errorMessage = error.message || "Unknown error";
        const isRecoverable = isRecoverableError(error);

        if (isRecoverable) {
            // Mark as failed but don't prevent QStash retry
            await postService.markAsFailed(postId, errorMessage, true);

            // Return 500 to trigger QStash retry
            return c.json(
                { status: "error", error: errorMessage, recoverable: true },
                500
            );
        } else {
            // Permanent failure - mark as failed and return 200 to stop retries
            await postService.markAsFailed(postId, errorMessage, true);

            console.log(`Permanent failure for post ${postId}: ${errorMessage}`);

            return c.json({
                status: "failed",
                error: errorMessage,
                recoverable: false,
            });
        }
    }
});

/**
 * Determines if an error is recoverable (should be retried).
 */
function isRecoverableError(error: any): boolean {
    const code = error.code || error.status;
    const message = error.message || "";

    // Rate limited - recoverable
    if (code === 429) return true;

    // Server errors - recoverable
    if (code >= 500 && code < 600) return true;

    // Timeout errors - recoverable
    if (message.includes("timeout") || message.includes("ETIMEDOUT")) return true;

    // Network errors - recoverable
    if (message.includes("ECONNRESET") || message.includes("ENOTFOUND")) return true;

    // Auth errors after token refresh failed - not recoverable
    if (code === 401 || code === 403) return false;

    // Duplicate tweet - not recoverable
    if (message.includes("duplicate")) return false;

    // Invalid content - not recoverable
    if (code === 400) return false;

    // Default: assume recoverable for unknown errors
    return true;
}
