import { Client, Receiver } from "@upstash/qstash";

export interface QStashConfig {
    token: string;
    currentSigningKey: string;
    nextSigningKey: string;
}

/**
 * Creates a QStash client for publishing messages to the queue.
 */
export function createQStashClient(token: string) {
    return new Client({ token });
}

/**
 * Creates a QStash receiver for verifying webhook signatures.
 */
export function createQStashReceiver(config: {
    currentSigningKey: string;
    nextSigningKey: string;
}) {
    return new Receiver({
        currentSigningKey: config.currentSigningKey,
        nextSigningKey: config.nextSigningKey,
    });
}

/**
 * QStash service wrapper for scheduling and managing messages.
 */
export class QStashService {
    private client: Client;
    private receiver: Receiver;
    private backendUrl: string;

    constructor(config: QStashConfig & { backendUrl: string }) {
        this.client = createQStashClient(config.token);
        this.receiver = createQStashReceiver({
            currentSigningKey: config.currentSigningKey,
            nextSigningKey: config.nextSigningKey,
        });
        this.backendUrl = config.backendUrl;
    }

    /**
     * Verify a QStash webhook signature.
     */
    async verifySignature(signature: string, body: string): Promise<boolean> {
        try {
            return await this.receiver.verify({ signature, body });
        } catch {
            return false;
        }
    }

    /**
     * Push a single post to QStash with a delay.
     * @param postId - The scheduled post ID
     * @param delaySeconds - Delay in seconds until delivery
     */
    async pushToQStash(postId: string, delaySeconds: number) {
        const response = await this.client.publishJSON({
            url: `${this.backendUrl}/api/qstash/post-tweet`,
            body: { postId },
            delay: delaySeconds,
            retries: 5,
        });

        return response.messageId;
    }

    /**
     * Push a batch of posts to QStash with rate limiting.
     * Chunks by 100 posts with 500ms delay between chunks.
     */
    async pushBatchToQStash(
        posts: Array<{ id: string; delaySeconds: number }>,
    ) {
        const CHUNK_SIZE = 100;
        const CHUNK_DELAY_MS = 500;
        const results: Array<{ postId: string; messageId: string }> = [];

        for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
            const chunk = posts.slice(i, i + CHUNK_SIZE);

            // Create batch messages
            const messages = chunk.map((post) => ({
                url: `${this.backendUrl}/api/qstash/post-tweet`,
                body: JSON.stringify({ postId: post.id }),
                delay: post.delaySeconds,
                retries: 5,
            }));

            // Publish batch
            const responses = await this.client.batchJSON(messages);

            // Collect results
            for (let j = 0; j < chunk.length; j++) {
                const post = chunk[j];
                const response = responses[j];
                if (post && response) {
                    results.push({
                        postId: post.id,
                        messageId: response.messageId,
                    });
                }
            }

            // Delay between chunks (except for last chunk)
            if (i + CHUNK_SIZE < posts.length) {
                await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
            }
        }

        return results;
    }

    /**
     * Cancel a scheduled QStash message.
     */
    async cancelMessage(messageId: string) {
        await this.client.messages.delete(messageId);
    }
}
