import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    fs: { allow: [".."] },
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/resources": "http://localhost:8080",
    },
  },
});
