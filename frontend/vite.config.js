import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("recharts")) {
            return "charts";
          }
          if (id.includes("framer-motion")) {
            return "motion";
          }
          if (id.includes("react")) {
            return "react";
          }
          return "vendor";
        }
      }
    }
  }
});
