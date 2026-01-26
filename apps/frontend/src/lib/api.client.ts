import { createApiClient } from "@repo/api/client"

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8787/api"

export const apiclient = createApiClient(apiUrl)
