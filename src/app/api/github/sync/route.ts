// ===========================================================================
// POST /api/github/sync — sync one file (fileId) or all files (all=true)
// ---------------------------------------------------------------------------
// Since files now LIVE on GitHub, "sync" just refreshes the stored SHA from
// the current repo tree so the dashboard shows accurate sync status.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
} from "@/lib/security";
import { syncFileToGithub, syncAllFiles } from "@/lib/github";
import { githubSyncSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => ({}));
  const parsed = githubSyncSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId, all } = parsed.data;

  if (all) {
    const result = await syncAllFiles();
    await logActivity({
      userId: user.id,
      action: ACTIONS.GITHUB_SYNC,
      target: "(all)",
      details: `${result.success}/${result.total} synced, ${result.failed} failed`,
      headers: req.headers,
    });
    return ok(result, `Synced ${result.success}/${result.total}`);
  }

  if (!fileId) return fail("fileId is required (or pass all=true)", 422);

  const result = await syncFileToGithub(fileId);
  if (!result.ok) {
    return fail(
      result.error || "Sync failed",
      result.conflict ? 409 : 500,
      { conflict: result.conflict, sha: result.sha },
    );
  }

  await logActivity({
    userId: user.id,
    action: ACTIONS.GITHUB_SYNC,
    target: fileId,
    details: `sha=${result.sha}`,
    headers: req.headers,
  });

  return ok({ fileId, sha: result.sha, synced: true }, "Synced to GitHub");
}
