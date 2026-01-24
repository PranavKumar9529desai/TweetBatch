import { TwitterApi } from "twitter-api-v2";
import { eq } from "drizzle-orm";
import * as schema from "@repo/db";
import { createDb } from "@repo/db";

type DbClient = ReturnType<typeof createDb>;

export class TwitterService {
  private db: DbClient;
  private clientId: string;
  private clientSecret: string;

  constructor(db: DbClient, clientId: string, clientSecret: string) {
    this.db = db;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Posts a tweet for a specific user.
   * Handles token refreshing automatically.
   */
  async postTweet(userId: string, content: string) {
    // 1. Fetch user and their Twitter account
    const userWithAccount = await this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, userId),
      with: {
        accounts: {
          where: (accounts, { eq }) => eq(accounts.providerId, "twitter"),
        },
      },
    });

    if (
      !userWithAccount ||
      !userWithAccount.accounts ||
      userWithAccount.accounts.length === 0
    ) {
      throw new Error(`No Twitter account linked for user ${userId}`);
    }

    const twitterAccount = userWithAccount.accounts[0];

    if (!twitterAccount.accessToken) {
      throw new Error(`Twitter account for user ${userId} has no access token`);
    }

    // 2. Initialize Client
    let client = new TwitterApi(twitterAccount.accessToken);

    try {
      // 3. Try to Post
      const tweet = await client.v2.tweet(content);
      return tweet.data;
    } catch (error: any) {
      // 4. Handle Token Expiration
      if (error.code === 401 || error.message?.includes("Unauthorized")) {
        console.log(
          `Access token for user ${userId} might be expired. Attempting refresh...`,
        );

        const newTokens = await this.refreshTokens(twitterAccount);

        // Retry with new access token
        client = new TwitterApi(newTokens.accessToken);
        const retryTweet = await client.v2.tweet(content);
        return retryTweet.data;
      }

      // Re-throw other errors
      throw error;
    }
  }

  private async refreshTokens(account: typeof schema.account.$inferSelect) {
    if (!account.refreshToken) {
      throw new Error("No refresh token available. Cannot refresh.");
    }

    const authedClient = new TwitterApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    try {
      const {
        client: refreshedClient,
        accessToken,
        refreshToken,
        expiresIn,
      } = await authedClient.refreshOAuth2Token(account.refreshToken);

      // Calculate expiry
      // expiresIn is usually in seconds
      const expiresAt = new Date(Date.now() + (expiresIn || 7200) * 1000);

      // Update DB
      await this.db
        .update(schema.account)
        .set({
          accessToken: accessToken,
          refreshToken: refreshToken, // Refresh token might rotate
          accessTokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.account.id, account.id));

      console.log(`Tokens refreshed and saved for account ${account.id}`);

      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw new Error("Failed to refresh Twitter token");
    }
  }
}
