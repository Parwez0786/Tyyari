import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(root, "node_modules/react"),
      "react-dom": path.resolve(root, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "@tanstack/react-query",
      "zustand",
      "lucide-react",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    proxy: {
      "/__mailpit": {
        target: process.env.MAILPIT_PROXY || "http://localhost:8026",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__mailpit/, "/api/v1"),
      },
      "/api/piston": {
        target: process.env.PISTON_URL || "http://localhost:2000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/piston/, "/api/v2"),
      },
    },
  },
});
