import { Context } from "hono";
import { createDb } from "@repo/db";
import { TwitterService } from "../services/twitter.service";
import { Bindings } from "../types";

export const DirectPostRoute = async (c: Context<{ Bindings: Bindings }>) => {
    const { userId, content } = await c.req.json();

    if (!userId || !content) {
        return c.json({ success: false, error: "Missing userId or content" }, 400);
    }

    const db = createDb(c.env.DATABASE_URL);
    const twitterService = new TwitterService(
        db,
        c.env.TWITTER_CLIENT_ID,
        c.env.TWITTER_CLIENT_SECRET,
    );

    try {
        const result = await twitterService.postTweet(userId, content);
        return c.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Error posting tweet:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
};
