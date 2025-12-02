import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "./src",                 // 소스가 src 안에 있으므로 명시
  build: {
    outDir: "build",           // 🔸 dist가 server와 같은 레벨에 생김
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});