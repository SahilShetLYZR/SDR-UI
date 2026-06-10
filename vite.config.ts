import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // lyzr-agent is a GitHub dependency that ships no built dist/ (its package.json
      // points at dist/index.js, which never gets built on install). Resolve the bare
      // import straight to its TypeScript source so Vite/esbuild transpiles it.
      "lyzr-agent": path.resolve(
        __dirname,
        "./node_modules/lyzr-agent/src/index.ts"
      ),
    },
  },
  optimizeDeps: {
    // Excluded from pre-bundling because it's aliased to raw TS source above.
    exclude: ["lyzr-agent"],
  },
}));
