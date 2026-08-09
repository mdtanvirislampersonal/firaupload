// ===========================================================================
// POST /api/github/delete — remove a file from GitHub (does not delete local)
// ===========================================================================

import { NextRequest } from "next/server";
import { ok, fail, getServerSessionUser } from "@/lib/security";
import { deleteFileFromGithub } from "@/lib/github";
import { getFileMetaById } from "@/lib/github-store";
import { githubDeleteSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = githubDeleteSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  const { fileId } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);

  const result = await deleteFileFromGithub(fileId);
  if (!result.ok) {
    return fail(result.error || "Delete failed", 500);
  }

  await logActivity({
    userId: user.id,
    action: ACTIONS.GITHUB_DELETE,
    target: file.relativePath,
    details: file.name,
    headers: req.headers,
  });

  return ok({ fileId, deleted: true }, "Removed from GitHub");
}
