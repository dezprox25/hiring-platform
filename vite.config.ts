import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import path from "path";

/** Nest routes (no global /api prefix) — proxied when the app uses same-origin HTTP in dev. */
const NEST_HTTP_PREFIXES = [
  "auth",
  "candidates",
  "reports",
  "analytics",
  "health",
  "metrics",
  "question-bank",
  "assessments",
  "ai-evaluations",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default must match typical local Nest `PORT` (see dezprox-backend/.env). Docker Compose maps API to 4000 — set VITE_DEV_API_PROXY=http://localhost:4000 if you use that.
  const proxyTarget = env.VITE_DEV_API_PROXY || "http://localhost:4001";

  const proxy: Record<string, { target: string; changeOrigin: boolean; ws?: boolean }> = {
    "/socket.io": { target: proxyTarget, changeOrigin: true, ws: true },
  };
  for (const p of NEST_HTTP_PREFIXES) {
    proxy[`/${p}`] = { target: proxyTarget, changeOrigin: true };
  }

  return {
    plugins: [
      TanStackRouterVite(),
      react(),
      tailwindcss(),
      tsConfigPaths(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy,
    },
  };
});
