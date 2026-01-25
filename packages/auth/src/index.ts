import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import * as schema from "@repo/db";
import { sendMagicLinkEmail } from "./utils/email.js";

export const getAuth = (env: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    FRONTEND_URL: string;
    GMAIL_USER: string;
    GMAIL_PASSWORD: string;
}) => betterAuth({
    basePath: "/api/auth",
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
        },
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                console.log("Sending magic link to", email, "with url", url);
                await sendMagicLinkEmail(email, url, env.GMAIL_USER, env.GMAIL_PASSWORD);
            },
        }),
    ],
});

export type Auth = ReturnType<typeof getAuth>;
