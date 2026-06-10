import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const srcPath = path.resolve(__dirname, "./node_modules/lyzr-agent/src/index.ts");
  const lyzrAgentAlias = fs.existsSync(srcPath) 
    ? srcPath
    : "lyzr-agent"; // Fallback to package.json main entry if src doesn't exist (CI environments)

  return {
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
        // lyzr-agent: conditionally alias to source in dev, fall back to package.json main in CI
        "lyzr-agent": lyzrAgentAlias,
      },
    },
    optimizeDeps: {
      // Only exclude from pre-bundling if we're using the TS source alias
      exclude: fs.existsSync(srcPath) ? ["lyzr-agent"] : [],
    },
  };
});
