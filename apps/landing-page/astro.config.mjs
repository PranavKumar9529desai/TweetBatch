import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';


// https://astro.build/config
export default defineConfig({
  output: 'static',

  vite: {
    resolve: {
      // alias: {
      //   "react-dom/server": "react-dom/server.edge",
      // },
    },
  },
  integrations: [tailwind(), react()],
});