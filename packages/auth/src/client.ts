import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    // Point to the backend URL where auth is mounted
    baseURL: "http://localhost:8787"
});
