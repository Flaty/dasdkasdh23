// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    UnoCSS({
      configFile: path.resolve("./uno.config.ts"),
    }),
  ],
  server: {
    // --- Твои существующие настройки ---
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    allowedHosts: ["https://acc-hide-largely-par.trycloudflare.com"],

    // --- 🔽 ВОТ СЮДА ДОБАВЛЯЕМ ПРОКСИ ---
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});