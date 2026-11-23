import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Only scan the React app for dependencies (public/room.html loads three.js from a CDN)
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    port: 3000,
    // Send /api requests to the AI server (backend/server.js, port 8787)
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
