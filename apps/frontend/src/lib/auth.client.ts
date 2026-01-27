import { createAuthClientFactory } from "@repo/api/client"

const authUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8787"}/api/auth`

export const authClient = createAuthClientFactory(authUrl)
