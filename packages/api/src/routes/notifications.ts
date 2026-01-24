import { Hono } from "hono";
import { createDb } from "@repo/db";
import { NotificationService } from "../services/notification";
import type { Bindings } from "../types";

export const notificationsRoute = new Hono<{ Bindings: Bindings }>();

const getService = (env: Bindings) => {
    const db = createDb(env.DATABASE_URL);
    return new NotificationService(db);
};

// GET / - List notifications
notificationsRoute.get("/", async (c) => {
    // In a real app, userId would come from auth context
    const userId = c.req.query("userId");
    if (!userId) return c.json({ error: "userId required" }, 401);

    const service = getService(c.env);
    const notifications = await service.getNotifications(userId);
    return c.json({ success: true, notifications });
});

// PATCH /:id/read - Mark as read
notificationsRoute.patch("/:id/read", async (c) => {
    const userId = c.req.query("userId");
    if (!userId) return c.json({ error: "userId required" }, 401);

    const id = c.req.param("id");
    const service = getService(c.env);
    const updated = await service.markAsRead(id, userId);

    if (!updated) return c.json({ error: "Notification not found" }, 404);
    return c.json({ success: true, notification: updated });
});

// PATCH /read-all - Mark all as read
notificationsRoute.patch("/read-all", async (c) => {
    const userId = c.req.query("userId");
    if (!userId) return c.json({ error: "userId required" }, 401);

    const service = getService(c.env);
    await service.markAllAsRead(userId);
    return c.json({ success: true });
});
