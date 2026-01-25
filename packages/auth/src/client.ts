import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    // Point to the backend URL where auth is mounted
    baseURL: "http://localhost:8787",
    plugins: [magicLinkClient()],
});
