import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  optimizeDeps: {
    include: ["@excalidraw/excalidraw", "@xyflow/react"],
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
