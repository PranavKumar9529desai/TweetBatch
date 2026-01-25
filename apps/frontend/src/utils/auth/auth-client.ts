import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787",
    plugins: [magicLinkClient()],
});
