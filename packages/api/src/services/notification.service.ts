import { createDb, notification, eq, and, desc } from "@repo/db";
import { randomUUID } from "crypto";

type DbClient = ReturnType<typeof createDb>;

export type NotificationType = "post_failed" | "account_disconnected" | "system";

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    message: string;
    data?: Record<string, any>;
}

export class NotificationService {
    private db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    /**
     * Create a new notification.
     */
    async createNotification(input: CreateNotificationInput) {
        const id = randomUUID();
        const [created] = await this.db
            .insert(notification)
            .values({
                id,
                userId: input.userId,
                type: input.type,
                message: input.message,
                data: input.data ? JSON.stringify(input.data) : null,
                isRead: false,
            })
            .returning();
        return created;
    }

    /**
     * Get notifications for a user.
     */
    async getNotifications(userId: string, limit = 50, offset = 0) {
        const notifications = await this.db.query.notification.findMany({
            where: eq(notification.userId, userId),
            orderBy: [desc(notification.createdAt)],
            limit,
            offset,
        });

        // Parse JSON data
        return notifications.map(n => ({
            ...n,
            data: n.data ? JSON.parse(n.data) : null,
        }));
    }

    /**
     * Mark a notification as read.
     */
    async markAsRead(notificationId: string, userId: string) {
        const [updated] = await this.db
            .update(notification)
            .set({ isRead: true })
            .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
            .returning();
        return updated;
    }

    /**
     * Mark all notifications as read for a user.
     */
    async markAllAsRead(userId: string) {
        await this.db
            .update(notification)
            .set({ isRead: true })
            .where(and(eq(notification.userId, userId), eq(notification.isRead, false)));
    }
}
