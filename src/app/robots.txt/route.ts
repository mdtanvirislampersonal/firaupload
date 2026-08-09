// ===========================================================================
// GET /robots.txt
// ===========================================================================

import { NextRequest } from "next/server";
import { buildRobotsTxt } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const body = buildRobotsTxt(req.headers);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
