import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Enable code splitting for better caching and performance on Vercel
    // (previously vite-plugin-singlefile inlined everything into one 600KB file,
    // defeating React.lazy and Vercel's CDN caching)
    cssCodeSplit: true,
    sourcemap: false,
  },
});
