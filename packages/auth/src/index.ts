import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@repo/db";

// This is for the CLI and as a default instance
export const auth = betterAuth({
    database: drizzleAdapter(schema.createDb(process.env.DATABASE_URL || ""), {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    socialProviders: {
        twitter: {
            clientId: process.env.TWITTER_CLIENT_ID || "",
            clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
            scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
        }
    }
});
