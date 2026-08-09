// ===========================================================================
// Sitemap generation
// ---------------------------------------------------------------------------
// Builds an XML sitemap from the GitHub-stored file metadata where
// isIndexed = true and isDirectory = false. Uses getBaseUrl() so the URLs
// match the host the site is served from.
// ===========================================================================

import "server-only";

import { getAllFileMeta } from "@/lib/github-store";
import { getBaseUrl } from "@/lib/base-url";
import { buildPublicUrl } from "@/lib/filesystem";
import { sanitizeRelativePath } from "@/lib/security";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateSitemap(headers?: Headers): Promise<string> {
  const baseUrl = getBaseUrl(headers);
  const all = await getAllFileMeta();
  const files = Object.values(all)
    .filter((f) => f.isIndexed && !f.isDirectory)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const urls = files.map((f) => {
    const loc = `${baseUrl}${buildPublicUrl(f.relativePath)}`;
    const lastmod = new Date(f.updatedAt).toISOString();
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/**
 * Force the sitemap to be regenerated. We don't cache sitemaps in memory —
 * the route handler simply calls generateSitemap() fresh each request and
 * sets Cache-Control appropriately. This function exists as a hook for any
 * future cache invalidation.
 */
export async function invalidateSitemap(): Promise<void> {
  // No-op: the sitemap is computed fresh on every request.
  // Kept for API symmetry with the rest of the codebase.
}

export function buildRobotsTxt(headers?: Headers): string {
  const baseUrl = getBaseUrl(headers);
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

// re-export so consumers don't need to reach into security directly
export { sanitizeRelativePath };
