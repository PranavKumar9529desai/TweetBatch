import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    visualizer({
      open: true, // Automatically open the report in the browser on build
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-router')) {
              return 'router-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns')) {
              return 'ui-vendor';
            }
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },
})
