import { Hono } from "hono";
import { createDb } from "@repo/db";
import { QStashService } from "../services/qstash.service";
import { ScheduledPostService } from "../services/scheduled-post.service";
import { TwitterService } from "../services/twitter.service";
import { AccountService } from "../services/account.service";
import { classifyTwitterError, TwitterErrorType } from "../services/error-handler.service";
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
    const accountService = new AccountService(db);
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

        // Classify the error using dedicated service
        const classification = classifyTwitterError(error);

        console.log(`Error classification for post ${postId}:`, {
            type: classification.type,
            isRecoverable: classification.isRecoverable,
            shouldMarkAccountDisconnected: classification.shouldMarkAccountDisconnected,
            message: classification.message,
        });

        // Handle account disconnection
        if (classification.shouldMarkAccountDisconnected) {
            console.log(`Marking account as disconnected for user ${post.userId}`);

            await accountService.markAsDisconnected(
                post.userId,
                "twitter",
                classification.message
            );

            // Cancel all pending posts for this user
            const cancelledPendingCount = await postService.cancelAllPendingPostsForUser(
                post.userId,
                `Account disconnected: ${classification.message}`
            );

            // Cancel all queued posts and get their QStash message IDs
            const qstashMessageIds = await postService.cancelAllQueuedPostsForUser(
                post.userId,
                `Account disconnected: ${classification.message}`
            );

            // Cancel QStash messages (best effort)
            for (const messageId of qstashMessageIds) {
                try {
                    await qstashService.cancelMessage(messageId);
                } catch (cancelError) {
                    console.warn(`Failed to cancel QStash message ${messageId}:`, cancelError);
                }
            }

            console.log(
                `Account disconnection handled for user ${post.userId}: ` +
                `cancelled ${cancelledPendingCount} pending posts, ` +
                `${qstashMessageIds.length} queued posts`
            );
        }

        // Mark this specific post as failed
        await postService.markAsFailed(postId, classification.message, true);

        if (classification.isRecoverable) {
            // Return 500 to trigger QStash retry
            return c.json(
                {
                    status: "error",
                    errorType: classification.type,
                    error: classification.message,
                    recoverable: true,
                },
                500
            );
        } else {
            // Permanent failure - return 200 to stop retries
            console.log(`Permanent failure for post ${postId}: ${classification.message}`);

            return c.json({
                status: "failed",
                errorType: classification.type,
                error: classification.message,
                recoverable: false,
            });
        }
    }
});

