import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'src/client.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['hono', 'drizzle-orm', '@repo/db', '@repo/auth'],
    noExternal: ['better-auth']
})