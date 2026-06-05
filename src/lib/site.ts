/** Public site URL — set VITE_SITE_URL in .env for custom domain (e.g. https://resume-constructor.com) */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://resume-constructor.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "AI Resume Builder";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
