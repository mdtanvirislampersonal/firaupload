// ===========================================================================
// GET /sitemap.xml — dynamically generated from DB (isIndexed files only)
// ===========================================================================

import { NextRequest } from "next/server";
import { generateSitemap } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const xml = await generateSitemap(req.headers);
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
