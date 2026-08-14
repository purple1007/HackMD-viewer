import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/

export default defineConfig({
  root: "./ui-src",
  plugins: [reactRefresh(), viteSingleFile()],
  // Honour the port assigned by the harness (PORT env); fall back to Vite's
  // default for a plain `npm run dev`.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    outDir: "../dist",
    rollupOptions: {
      inlineDynamicImports: true,
    },
  },
});
