import { hc } from "hono/client";
import type { AppType } from "./index";

/**
 * Create an API client for frontend use.
 * @param baseUrl - The base URL of the API (e.g., "http://localhost:8787/api")
 */
export function createApiClient(baseUrl: string) {
    return hc<AppType>(baseUrl, {
        init: {
            credentials: "include"
        }
    });
}

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/**
 * Create an auth client for frontend use.
 * @param baseUrl - The base URL of the backend where auth is mounted (e.g., "http://localhost:8787")
 */
export function createAuthClientFactory(baseUrl: string) {
    return createAuthClient({
        baseURL: baseUrl,
        plugins: [magicLinkClient()],
    });
}

// Re-export the type for convenience
export type { AppType };
