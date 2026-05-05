import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:8080",
        changeOrigin: true,
      },
      "/api-bayse": {
        target: "https://relay.bayse.markets/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-bayse/, ""),
      },
    },
  },
});
