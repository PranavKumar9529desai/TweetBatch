import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    // Point to the backend URL where auth is mounted
    baseURL: process.env.BACKEND_URL || "http://localhost:8787"
});
