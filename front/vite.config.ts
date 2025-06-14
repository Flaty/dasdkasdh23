import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import path from "node:path";

const buildTime = Date.now().toString();

import { htmlVersionInject } from './vite-html-version-inject'; // создашь этот файл

export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    UnoCSS({
      configFile: path.resolve("./uno.config.ts"),
    }),
    htmlVersionInject(buildTime),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
