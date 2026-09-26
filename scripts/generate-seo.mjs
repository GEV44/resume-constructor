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
  { loc: "/ats-checker", priority: "0.9", changefreq: "monthly" },
  { loc: "/login", priority: "0.5", changefreq: "monthly" },
  { loc: "/signup", priority: "0.7", changefreq: "monthly" },
];
// Dashboard routes require sign-in, so they are kept out of the sitemap and disallowed below.

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

const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /reset-password

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve(root, "public/sitemap.xml"), sitemap);
writeFileSync(resolve(root, "public/robots.txt"), robots);
console.log(`SEO files generated for ${siteUrl}`);
