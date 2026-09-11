/**
 * Build-time sitemap generator.
 *
 * Regenerates public/sitemap.xml with the current date as <lastmod> so search
 * engines always see fresh content on every deploy. Runs automatically before
 * `vite build` (see package.json "build" script).
 *
 * Usage: node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "https://footypredict.ai";

const ROUTES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/predictions", changefreq: "hourly", priority: "0.9" },
  { loc: "/results", changefreq: "daily", priority: "0.9" },
  { loc: "/past-predictions", changefreq: "daily", priority: "0.8" },
  { loc: "/premium", changefreq: "weekly", priority: "0.8" },
  { loc: "/profile", changefreq: "monthly", priority: "0.7" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.5" },
];

const today = new Date().toISOString().split("T")[0];

const urls = ROUTES.map(
  (r) => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
writeFileSync(outPath, sitemap);
console.log(`[sitemap] wrote ${outPath} (lastmod=${today})`);
