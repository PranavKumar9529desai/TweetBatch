import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    // In a shared package, we typically don't hardcode the baseURL
    // It should be provided by the environment or as a configuration
    baseURL: process.env.FRONTEND_URL || "http://localhost:3000"
});
