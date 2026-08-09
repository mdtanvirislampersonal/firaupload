// ===========================================================================
// GET /api/stats — dashboard overview counts
// ---------------------------------------------------------------------------
// Counts are computed from the repo tree + metadata. No database.
// ===========================================================================

import { NextRequest } from "next/server";
import { ok, fail, getServerSessionUser } from "@/lib/security";
import { getRepoTree, getAllFileMeta } from "@/lib/github-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const HIDDEN_PREFIXES = [".file-manager"];

function isHidden(path: string): boolean {
  return HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export async function GET(_req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  try {
    const [tree, meta] = await Promise.all([getRepoTree(), getAllFileMeta()]);
    const files = tree.filter((e) => e.type === "file" && !isHidden(e.path) && e.name !== ".gitkeep");
    const totalFiles = files.length;
    const totalStorageBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

    // Indexing counts come from metadata (files not in metadata default to not indexed)
    let indexedFiles = 0;
    let noIndexFiles = 0;
    let googleIndexed = 0;
    let googleNotIndexed = 0;
    let githubSynced = 0;
    for (const f of files) {
      const m = meta[f.path];
      const isIndexed = m?.isIndexed ?? false;
      const googleStatus = m?.googleIndexStatus ?? "UNKNOWN";
      if (isIndexed) indexedFiles++;
      else noIndexFiles++;
      if (googleStatus === "INDEXED") googleIndexed++;
      else googleNotIndexed++;
      if (f.sha) githubSynced++;
    }

    // Folders: count distinct directory segments in the tree
    const folderSet = new Set<string>();
    for (const e of tree) {
      if (isHidden(e.path)) continue;
      const parts = e.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        folderSet.add(parts.slice(0, i).join("/"));
      }
    }
    const folders = folderSet.size;

    return ok({
      totalFiles,
      indexedFiles,
      noIndexFiles,
      googleIndexed,
      googleNotIndexed,
      githubSynced,
      folders,
      totalStorageBytes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("stats.error", { message });
    return fail("Could not compute stats: " + message, 500);
  }
}
