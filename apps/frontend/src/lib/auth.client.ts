import { createAuthClientFactory } from "@repo/api/client"

const authUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8787"

export const authClient = createAuthClientFactory(authUrl)
