import { pgTable, text, timestamp, boolean, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => new Date())
            .notNull(),
        // Disconnection tracking for handling permanent auth failures
        disconnectedAt: timestamp("disconnected_at"),
        disconnectedReason: text("disconnected_reason"),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);


export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const scheduledPost = pgTable(
    "scheduled_post",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        scheduledAt: timestamp("scheduled_at"),

        // Status: draft → pending → queued → posted/failed/cancelled
        // draft: created in create-tweet, not yet scheduled in kanban
        // pending: scheduled time set in kanban, ready to sync to QStash
        // queued: synced to QStash, awaiting delivery
        // posted/failed/cancelled: terminal states
        status: text("status").default("draft").notNull(),

        // QStash tracking
        syncedToQStash: boolean("synced_to_qstash").default(false).notNull(),
        qstashMessageId: text("qstash_message_id"),

        // Result tracking
        tweetId: text("tweet_id"),
        errorMessage: text("error_message"),
        retryCount: integer("retry_count").default(0).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        postedAt: timestamp("posted_at"),
        failedAt: timestamp("failed_at"),
    },
    (table) => [
        index("scheduled_post_userId_idx").on(table.userId),
        index("scheduled_post_status_idx").on(table.status),
        index("scheduled_post_scheduledAt_idx").on(table.scheduledAt),
    ],
);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    scheduledPosts: many(scheduledPost),
    notifications: many(notification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const scheduledPostRelations = relations(scheduledPost, ({ one }) => ({
    user: one(user, {
        fields: [scheduledPost.userId],
        references: [user.id],
    }),
}));

export const notification = pgTable(
    "notification",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        type: text("type").notNull(), // 'post_failed', 'account_disconnected', 'system'
        message: text("message").notNull(),
        data: text("data"), // JSON stringified data
        isRead: boolean("is_read").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("notification_userId_idx").on(table.userId),
        index("notification_isRead_idx").on(table.isRead),
    ],
);

export const notificationRelations = relations(notification, ({ one }) => ({
    user: one(user, {
        fields: [notification.userId],
        references: [user.id],
    }),
}));

