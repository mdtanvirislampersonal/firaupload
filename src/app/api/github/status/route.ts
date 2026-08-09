// ===========================================================================
// GET /api/github/status — show whether GitHub sync is configured + reachable
// ===========================================================================

import { NextRequest } from "next/server";
import { fail, getServerSessionUser, ok } from "@/lib/security";
import { getGithubStatus } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const status = await getGithubStatus();
  return ok(status);
}
