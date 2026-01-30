import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  vite: {
    resolve: {
      // alias: {
      //   "react-dom/server": "react-dom/server.edge",
      // },
    },
  },
  integrations: [tailwind(), react()],
});