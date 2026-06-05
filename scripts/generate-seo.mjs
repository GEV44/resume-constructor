import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const siteUrl = (
  process.env.VITE_SITE_URL || "https://resume-constructor-gev44.vercel.app"
).replace(/\/$/, "");

const pages = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/login", priority: "0.5", changefreq: "monthly" },
  { loc: "/signup", priority: "0.7", changefreq: "monthly" },
  { loc: "/dashboard", priority: "0.6", changefreq: "weekly" },
  { loc: "/dashboard/upload", priority: "0.6", changefreq: "weekly" },
  { loc: "/dashboard/analyses", priority: "0.6", changefreq: "weekly" },
  { loc: "/dashboard/optimizations", priority: "0.6", changefreq: "weekly" },
  { loc: "/dashboard/profile", priority: "0.4", changefreq: "monthly" },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const robots = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve(root, "public/sitemap.xml"), sitemap);
writeFileSync(resolve(root, "public/robots.txt"), robots);
console.log(`SEO files generated for ${siteUrl}`);
