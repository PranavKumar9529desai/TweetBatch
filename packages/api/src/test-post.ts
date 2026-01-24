
import { TwitterApi } from 'twitter-api-v2';
import { createDb } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local in the root or specific package
dotenv.config({ path: path.join(__dirname, '../.env.local') });


/**
 * POC Script to verify Twitter Posting Flow
 * Usage: bun src/test-post.ts
 */
async function main() {
    console.log("Starting Twitter POC...");

    // 1. Initialize DB
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing!");
    }
    const db = createDb(process.env.DATABASE_URL);

    // 2. Fetch a user with a Twitter account
    // For this POC, we'll just grab the first user who has a twitter account linked
    const usersWithAccounts = await db.query.user.findFirst({
        with: {
            accounts: {
                where: (accounts, { eq }) => eq(accounts.providerId, 'twitter')
            }
        }
    });

    if (!usersWithAccounts || usersWithAccounts.accounts.length === 0) {
        console.error("No user found with a Twitter account linked.");
        return;
    }

    const twitterAccount = usersWithAccounts.accounts[0];

    if (!twitterAccount) {
        throw new Error('Twitter account not found');
    }
    console.log(`Found user: ${usersWithAccounts.name} (${usersWithAccounts.email})`);
    console.log(`Account ID: ${twitterAccount.id}`);
    console.log(`Access Token (preview): ${twitterAccount.accessToken?.substring(0, 10)}...`);

    // 3. Setup Twitter Client
    // We need the Client ID and Secret for refreshing tokens if necessary
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET is missing in .env");
    }

    // Initialize with the stored access token
    // NOTE: In a real app, we check expiration. Here we just try, and if 401, we refresh.
    let client = new TwitterApi(twitterAccount.accessToken!);

    try {
        // 4. Try to Post
        console.log("Attempting to post tweet...");
        const tweet = await client.v2.tweet(`Hello World! Timestamp: ${new Date().toISOString()}`);
        console.log("Tweet successfully posted!");
        console.log("Tweet ID:", tweet.data.id);
        console.log("Tweet Text:", tweet.data.text);

    } catch (error: any) {
        console.error("Error posting tweet:", error.message || error);
        if (error.data) {
            console.error("Error Data:", JSON.stringify(error.data, null, 2));
        }
        if (error.rateLimit) {
            console.error("Rate Limit Info:", JSON.stringify(error.rateLimit, null, 2));
        }

        // 5. Handle Refresh Token Logic (Simplified POC)
        if (error.code === 401 || error.message?.includes('Unauthorized')) {
            console.log("Access token might be expired. Attempting refresh...");

            if (!twitterAccount.refreshToken) {
                console.error("No refresh token available. Cannot refresh.");
                return;
            }

            const authedClient = new TwitterApi({
                clientId,
                clientSecret,
            });

            try {
                const { client: refreshedClient, accessToken, refreshToken } = await authedClient.refreshOAuth2Token(twitterAccount.refreshToken);

                console.log("Token refreshed successfully!");
                console.log("New Access Token:", accessToken.substring(0, 10) + "...");

                // Retry Post
                const retryTweet = await refreshedClient.v2.tweet(`Hello World! (Refreshed) ${new Date().toISOString()}`);
                console.log("Tweet successfully posted after refresh!");
                console.log("Tweet ID:", retryTweet.data.id);

                // TODO: Save new tokens to DB (Manual step for POC or implemented if desired)
                console.log("IMPORTANT: New tokens were generated but not saved to DB in this POC script.");
            } catch (refreshError) {
                console.error("Failed to refresh token:", refreshError);
            }
        }
    }
}

main().catch(console.error);
