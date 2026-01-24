import { createDb } from "@repo/db";
import { QStashService } from "../services/qstash";
import { ScheduledPostService } from "../services/scheduled-post";
import type { Bindings } from "../types";

/**
 * IST offset from UTC in hours (UTC+5:30)
 */
const IST_OFFSET_HOURS = 5.5;

/**
 * Get the current 6-hour window based on IST time.
 * Returns the start and end of the window.
 *
 * Windows:
 * - 00:00-06:00 IST
 * - 06:00-12:00 IST
 * - 12:00-18:00 IST
 * - 18:00-00:00 IST
 */
export function getCurrentWindow(): { windowStart: Date; windowEnd: Date } {
    const now = new Date();

    // Convert to IST
    const istNow = new Date(now.getTime() + IST_OFFSET_HOURS * 60 * 60 * 1000);
    const istHour = istNow.getUTCHours();

    // Determine window start hour in IST
    let windowStartHourIST: number;
    if (istHour >= 0 && istHour < 6) {
        windowStartHourIST = 0;
    } else if (istHour >= 6 && istHour < 12) {
        windowStartHourIST = 6;
    } else if (istHour >= 12 && istHour < 18) {
        windowStartHourIST = 12;
    } else {
        windowStartHourIST = 18;
    }

    // Create window start in IST, then convert to UTC
    const windowStartIST = new Date(istNow);
    windowStartIST.setUTCHours(windowStartHourIST, 0, 0, 0);

    // Convert IST to UTC
    const windowStart = new Date(
        windowStartIST.getTime() - IST_OFFSET_HOURS * 60 * 60 * 1000
    );
    const windowEnd = new Date(windowStart.getTime() + 6 * 60 * 60 * 1000);

    return { windowStart, windowEnd };
}

/**
 * Calculate delay in seconds from now until the scheduled time.
 */
export function calculateDelaySeconds(scheduledAt: Date): number {
    const now = new Date();
    const delayMs = scheduledAt.getTime() - now.getTime();

    // Minimum delay of 60 seconds to avoid immediate delivery issues
    return Math.max(60, Math.floor(delayMs / 1000));
}

/**
 * Sync scheduled posts to QStash for the current time window.
 * This is called by the Cloudflare Worker cron trigger.
 */
export async function syncPostsToQStash(env: Bindings): Promise<{
    synced: number;
    errors: number;
    window: { start: Date; end: Date };
}> {
    console.log("Starting QStash sync cron job...");

    const { windowStart, windowEnd } = getCurrentWindow();

    console.log(
        `Syncing posts for window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`
    );

    // Initialize services
    const db = createDb(env.DATABASE_URL);
    const postService = new ScheduledPostService(db);
    const qstashService = new QStashService({
        token: env.QSTASH_TOKEN,
        currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
        backendUrl: env.BACKEND_URL,
    });

    // Fetch unsynced posts for this window
    const unsyncedPosts = await postService.getUnsyncedPostsForWindow(
        windowStart,
        windowEnd
    );

    console.log(`Found ${unsyncedPosts.length} unsynced posts for this window`);

    if (unsyncedPosts.length === 0) {
        return { synced: 0, errors: 0, window: { start: windowStart, end: windowEnd } };
    }

    // Prepare posts with delay calculations
    const postsWithDelay = unsyncedPosts.map((post) => ({
        id: post.id,
        delaySeconds: calculateDelaySeconds(post.scheduledAt),
    }));

    // Push to QStash in batches
    let synced = 0;
    let errors = 0;

    try {
        const results = await qstashService.pushBatchToQStash(postsWithDelay);

        // Update each post with QStash message ID
        for (const result of results) {
            try {
                await postService.markAsSynced(result.postId, result.messageId);
                synced++;
                console.log(`Synced post ${result.postId} → QStash message ${result.messageId}`);
            } catch (error) {
                console.error(`Failed to mark post ${result.postId} as synced:`, error);
                errors++;
            }
        }
    } catch (error) {
        console.error("Failed to push batch to QStash:", error);
        errors = unsyncedPosts.length;
    }

    console.log(
        `Sync complete: ${synced} synced, ${errors} errors`
    );

    return { synced, errors, window: { start: windowStart, end: windowEnd } };
}

/**
 * Recovery cron job - runs 30 minutes after each main cron.
 * Finds posts that should have been synced but weren't, and marks them as failed.
 */
export async function recoverMissedPosts(env: Bindings): Promise<{
    found: number;
    marked: number;
}> {
    console.log("Starting recovery cron job...");

    const db = createDb(env.DATABASE_URL);
    const postService = new ScheduledPostService(db);

    // Look for posts that:
    // 1. Are still "pending"
    // 2. Have scheduledAt in the past
    // 3. Were never synced to QStash
    const now = new Date();
    const missedPosts = await postService.getUnsyncedPostsForWindow(
        new Date(0), // Beginning of time
        new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
    );

    console.log(`Found ${missedPosts.length} missed posts`);

    let marked = 0;
    for (const post of missedPosts) {
        try {
            await postService.markAsFailed(
                post.id,
                "Missed scheduling window - post was never synced to QStash",
                false
            );
            marked++;
            console.log(`Marked post ${post.id} as failed (missed window)`);
        } catch (error) {
            console.error(`Failed to mark post ${post.id} as failed:`, error);
        }
    }

    console.log(`Recovery complete: ${marked} posts marked as failed`);

    return { found: missedPosts.length, marked };
}
