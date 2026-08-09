// ===========================================================================
// GET /api/indexing/status?fileId=... — check Google index status for a file
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
} from "@/lib/security";
import { getFileMetaById } from "@/lib/github-store";
import { buildPublicUrl } from "@/lib/filesystem";
import { getBaseUrl } from "@/lib/base-url";
import { checkFileIndexStatus } from "@/lib/google";
import { indexingStatusSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const url = new URL(req.url);
  const parsed = indexingStatusSchema.safeParse({
    fileId: url.searchParams.get("fileId") || "",
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot check a directory", 422);

  const publicUrl = `${getBaseUrl(req.headers)}${buildPublicUrl(file.relativePath)}`;
  const result = await checkFileIndexStatus(fileId, publicUrl);

  await logActivity({
    userId: user.id,
    action: ACTIONS.GOOGLE_STATUS_CHECK,
    target: file.relativePath,
    details: result.status,
    headers: req.headers,
  });

  return ok({ status: result.status, message: result.message, enabled: result.enabled, checkedAt: result.checkedAt, url: publicUrl });
}
