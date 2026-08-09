// ===========================================================================
// POST /api/files/delete — delete a file or folder from GitHub + metadata
// ===========================================================================

import { NextRequest } from "next/server";
import { ok, fail, getServerSessionUser } from "@/lib/security";
import {
  getRepoTree,
  getFileMetaById,
  deleteFileMeta,
  deleteFileMetaByPrefix,
  deleteFileContent,
  deleteVersionsForFile,
  invalidateTree,
} from "@/lib/github-store";
import { deleteSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);

  try {
    if (file.isDirectory) {
      // Walk the tree and delete every descendant file.
      const tree = await getRepoTree();
      const prefix = file.relativePath + "/";
      const descendants = tree.filter(
        (e) => e.path === file.relativePath || e.path.startsWith(prefix),
      );
      for (const entry of descendants) {
        if (entry.type === "file") {
          await deleteFileContent(entry.path, entry.sha).catch(() => {});
        }
      }
      // Remove metadata for the folder + all descendants
      const removed = await deleteFileMetaByPrefix(file.relativePath);
      // Remove versions for any removed file entries
      for (const r of removed) {
        if (!r.isDirectory) {
          await deleteVersionsForFile(r.id).catch(() => {});
        }
      }
    } else {
      const tree = await getRepoTree();
      const entry = tree.find((e) => e.path === file.relativePath);
      await deleteFileContent(file.relativePath, entry?.sha ?? file.githubSha ?? undefined).catch(() => {});
      await deleteFileMeta(file.relativePath);
      await deleteVersionsForFile(fileId).catch(() => {});
    }

    invalidateTree();

    await logActivity({
      userId: user.id,
      action: ACTIONS.DELETE,
      target: file.relativePath,
      details: file.isDirectory
        ? `folder ${file.name}`
        : `${file.name} (${file.size} bytes)`,
      headers: req.headers,
    });

    return ok({ id: fileId }, "Deleted");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("delete.error", { id: fileId, message });
    return fail("Could not delete: " + message, 500);
  }
}
