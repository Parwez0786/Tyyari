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
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@excalidraw/excalidraw", "@xyflow/react"],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api/piston": {
        target: process.env.PISTON_URL || "http://localhost:2000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/piston/, "/api/v2"),
      },
    },
  },
});
