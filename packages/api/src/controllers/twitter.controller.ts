import { Context } from "hono";
import { createDb } from "@repo/db";
import { ScheduledPostService } from "../services/scheduled-post.service";
import { Bindings } from "../types";

export const DirectPostRoute = async (c: Context<{ Bindings: Bindings }>) => {
    const { userId, content } = await c.req.json();

    if (!userId || !content) {
        return c.json({ success: false, error: "Missing userId or content" }, 400);
    }

    if (content.length > 280) {
        return c.json({ success: false, error: "Content exceeds 280 characters" }, 400);
    }

    const db = createDb(c.env.DATABASE_URL);
    const postService = new ScheduledPostService(db);

    try {
        // Create a draft post instead of posting directly
        // User can then schedule it in the kanban/manage-tweet view
        const draftPost = await postService.createScheduledPost({
            userId,
            content,
            scheduledAt: new Date(), // Will be updated when user schedules it
        });

        return c.json({ 
            success: true, 
            data: {
                postId: draftPost.id,
                status: draftPost.status,
                message: "Post created as draft. Go to Manage Tweets to schedule it."
            }
        });
    } catch (error: any) {
        console.error("Error creating draft post:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
};
