import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" &&
      (() => {
        try {
          return require("lovable-tagger").componentTagger();
        } catch {
          return null;
        }
      })(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  server: { port: 5173, host: true },
}));
