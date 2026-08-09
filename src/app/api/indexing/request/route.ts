// ===========================================================================
// POST /api/indexing/request — request Google to (re)index a file's URL
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
import { requestFileIndexing } from "@/lib/google";
import { indexingRequestSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = indexingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot request indexing for a directory", 422);

  const publicUrl = `${getBaseUrl(req.headers)}${buildPublicUrl(file.relativePath)}`;
  const result = await requestFileIndexing(fileId, publicUrl);

  await logActivity({
    userId: user.id,
    action: ACTIONS.GOOGLE_INDEX_REQUEST,
    target: file.relativePath,
    details: result.status,
    headers: req.headers,
  });

  return ok({ status: result.status, message: result.message, enabled: result.enabled, url: publicUrl });
}
