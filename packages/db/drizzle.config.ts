import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'fs';

if (existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
} else if (existsSync('../../.env.local')) {
    // Fallback for monorepo root if needed
    process.loadEnvFile('../../.env.local');
}

export default defineConfig({
    schema: './src/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
