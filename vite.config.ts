import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { vercelApiDev } from "./scripts/vite-api-dev";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side-only variables consumed by the api/*.ts functions (see
// lib/rapidapi.ts, lib/paystack.ts). Deliberately NOT VITE_-prefixed so they
// can never be inlined into the client bundle.
const SERVER_ENV_KEYS = ["RAPIDAPI_KEY", "PREDICTIONS_KEY", "PAYSTACK_SECRET_KEY"];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run dev` executes the /api functions locally (scripts/vite-api-dev.ts).
  // Forward server-side keys from the gitignored .env so they work the same as
  // on Vercel, where these are set in Project Settings → Environment Variables.
  const env = loadEnv(mode, __dirname, "");
  for (const key of SERVER_ENV_KEYS) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), vercelApiDev()],
    server: {
      host: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
