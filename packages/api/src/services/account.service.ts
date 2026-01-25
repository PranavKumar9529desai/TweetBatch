import { createDb, eq, and } from "@repo/db";
import * as schema from "@repo/db";
import { NotificationService } from "./notification.service";

type DbClient = ReturnType<typeof createDb>;

/**
 * Service for managing user accounts (OAuth providers).
 */
export class AccountService {
    private db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    /**
     * Get a user's Twitter account.
     */
    async getTwitterAccount(userId: string) {
        return this.db.query.account.findFirst({
            where: (account, { and, eq }) =>
                and(
                    eq(account.userId, userId),
                    eq(account.providerId, "twitter")
                ),
        });
    }

    /**
     * Check if a user's account is connected (not disconnected).
     */
    async isAccountConnected(userId: string, providerId: string = "twitter"): Promise<boolean> {
        const account = await this.db.query.account.findFirst({
            where: (account, { and, eq, isNull }) =>
                and(
                    eq(account.userId, userId),
                    eq(account.providerId, providerId),
                    isNull(account.disconnectedAt)
                ),
        });

        return !!account;
    }

    /**
     * Mark an account as disconnected.
     * This is called when we detect permanent auth failures.
     */
    async markAsDisconnected(userId: string, providerId: string, reason: string) {
        // Create notification first to alert user
        const notificationService = new NotificationService(this.db);
        await notificationService.createNotification({
            userId,
            type: "account_disconnected",
            message: `Your ${providerId} account was disconnected. Reason: ${reason}. Please reconnect to resume scheduling.`,
            data: { providerId, reason },
        });

        const [updated] = await this.db
            .update(schema.account)
            .set({
                disconnectedAt: new Date(),
                disconnectedReason: reason,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(schema.account.userId, userId),
                    eq(schema.account.providerId, providerId)
                )
            )
            .returning();

        return updated;
    }

    /**
     * Reconnect an account (clear disconnection status).
     * This would be called after user re-authenticates.
     */
    async reconnect(userId: string, providerId: string) {
        const [updated] = await this.db
            .update(schema.account)
            .set({
                disconnectedAt: null,
                disconnectedReason: null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(schema.account.userId, userId),
                    eq(schema.account.providerId, providerId)
                )
            )
            .returning();

        return updated;
    }
}
