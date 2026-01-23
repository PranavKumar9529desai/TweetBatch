import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@repo/db";

export const getAuth = (env: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;
    FRONTEND_URL: string;
}) => betterAuth({
    database: drizzleAdapter(schema.createDb(env.DATABASE_URL), {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_URL],
    socialProviders: {
        twitter: {
            clientId: env.TWITTER_CLIENT_ID,
            clientSecret: env.TWITTER_CLIENT_SECRET,
            scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
        }
    }
});

export type Auth = ReturnType<typeof getAuth>;
