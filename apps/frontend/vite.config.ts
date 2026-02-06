import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter(),
    react(),
    tsconfigPaths(),
    visualizer({
      open: true, // Automatically open the report in the browser on build
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Core React - be very specific to avoid catching other react-* packages
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react-vendor";
            }
            // TanStack Router
            if (id.includes("@tanstack/react-router")) {
              return "router-vendor";
            }

            // TanStack Query
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }

            // Chart library and dependencies
            if (
              id.includes("recharts") ||
              id.includes("victory-") ||
              id.includes("d3-")
            ) {
              return "charts-vendor";
            }

            // Editor libraries
            if (id.includes("@tiptap") || id.includes("prosemirror")) {
              return "editor-vendor";
            }

            // UI libraries
            if (
              id.includes("@radix-ui") ||
              id.includes("/node_modules/lucide-react/") ||
              id.includes("class-variance-authority") ||
              id.includes("/node_modules/clsx/") ||
              id.includes("tailwind-merge") ||
              id.includes("date-fns")
            ) {
              return "ui-vendor";
            }

            // Form libraries
            if (
              id.includes("react-hook-form") ||
              id.includes("/node_modules/zod/") ||
              id.includes("@hookform")
            ) {
              return "form-vendor";
            }
          }

          // Split application code by routes
          if (id.includes("/src/routes/dashboard/")) {
            return "dashboard-routes";
          }
          if (id.includes("/src/routes/auth/")) {
            return "auth-routes";
          }

          // Split large component groups
          if (id.includes("/src/components/dashboard/")) {
            return "dashboard-components";
          }
          if (id.includes("/src/components/posts/")) {
            return "posts-components";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
