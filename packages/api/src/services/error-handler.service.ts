/**
 * Error Handler Service
 * Classifies Twitter API errors and determines recovery strategies.
 */

export enum TwitterErrorType {
    RATE_LIMITED = 'rate_limited',
    AUTH_EXPIRED = 'auth_expired',
    ACCOUNT_REVOKED = 'account_revoked',
    TWITTER_DOWN = 'twitter_down',
    DUPLICATE_TWEET = 'duplicate_tweet',
    INVALID_CONTENT = 'invalid_content',
    NETWORK_ERROR = 'network_error',
    NO_ACCOUNT = 'no_account',
    UNKNOWN = 'unknown',
}

export interface TwitterErrorClassification {
    type: TwitterErrorType;
    message: string;
    isRecoverable: boolean;
    shouldMarkAccountDisconnected: boolean;
}

/**
 * Classifies a Twitter API error and determines the appropriate response strategy.
 */
export function classifyTwitterError(error: any): TwitterErrorClassification {
    const code = error.code || error.status;
    const message = error.message || 'Unknown error';

    // Rate limited - recoverable, QStash will retry
    if (code === 429) {
        return {
            type: TwitterErrorType.RATE_LIMITED,
            message: 'Rate limited by Twitter API',
            isRecoverable: true,
            shouldMarkAccountDisconnected: false,
        };
    }

    // Server errors (5xx) - recoverable, Twitter is down
    if (code >= 500 && code < 600) {
        return {
            type: TwitterErrorType.TWITTER_DOWN,
            message: `Twitter server error: ${code}`,
            isRecoverable: true,
            shouldMarkAccountDisconnected: false,
        };
    }

    // Timeout/network errors - recoverable
    if (
        message.includes('timeout') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ECONNRESET') ||
        message.includes('ENOTFOUND')
    ) {
        return {
            type: TwitterErrorType.NETWORK_ERROR,
            message: `Network error: ${message}`,
            isRecoverable: true,
            shouldMarkAccountDisconnected: false,
        };
    }

    // 401 Unauthorized - auth token expired (already tried refresh)
    // This happens after TwitterService.postTweet() already attempted refresh
    if (code === 401 || message.includes('Unauthorized')) {
        return {
            type: TwitterErrorType.AUTH_EXPIRED,
            message: 'Authentication failed after token refresh attempt',
            isRecoverable: false,
            shouldMarkAccountDisconnected: true,
        };
    }

    // 403 Forbidden - account revoked, suspended, or access denied
    if (code === 403 || message.includes('Forbidden')) {
        return {
            type: TwitterErrorType.ACCOUNT_REVOKED,
            message: 'Account access revoked or suspended',
            isRecoverable: false,
            shouldMarkAccountDisconnected: true,
        };
    }

    // No Twitter account linked
    if (message.includes('No Twitter account') || message.includes('no access token')) {
        return {
            type: TwitterErrorType.NO_ACCOUNT,
            message: 'No Twitter account linked',
            isRecoverable: false,
            shouldMarkAccountDisconnected: true,
        };
    }

    // Token refresh failed
    if (message.includes('Failed to refresh') || message.includes('No refresh token')) {
        return {
            type: TwitterErrorType.AUTH_EXPIRED,
            message: 'Token refresh failed',
            isRecoverable: false,
            shouldMarkAccountDisconnected: true,
        };
    }

    // Duplicate tweet - not recoverable
    if (message.toLowerCase().includes('duplicate')) {
        return {
            type: TwitterErrorType.DUPLICATE_TWEET,
            message: 'Duplicate tweet content',
            isRecoverable: false,
            shouldMarkAccountDisconnected: false,
        };
    }

    // 400 Bad Request - invalid content
    if (code === 400) {
        return {
            type: TwitterErrorType.INVALID_CONTENT,
            message: `Invalid tweet content: ${message}`,
            isRecoverable: false,
            shouldMarkAccountDisconnected: false,
        };
    }

    // Unknown error - assume recoverable for safety
    return {
        type: TwitterErrorType.UNKNOWN,
        message,
        isRecoverable: true,
        shouldMarkAccountDisconnected: false,
    };
}

/**
 * Determines if an error classification indicates a recoverable error.
 */
export function isRecoverable(classification: TwitterErrorClassification): boolean {
    return classification.isRecoverable;
}
