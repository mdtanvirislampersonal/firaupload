// ===========================================================================
// POST /api/indexing/toggle — enable/disable Google indexing for a file
// ---------------------------------------------------------------------------
// If the file exists on GitHub but has no metadata entry yet (e.g. it was
// committed directly to the repo outside this app), we auto-create one.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
} from "@/lib/security";
import { getFileMetaById, saveFileMeta, getRepoTree } from "@/lib/github-store";
import { toggleIndexSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const dynamic = "force-dynamic";

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
    cjs: "text/javascript",
    json: "application/json",
    xml: "application/xml",
    svg: "image/svg+xml",
    md: "text/markdown",
    csv: "text/csv",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    zip: "application/zip",
    gz: "application/gzip",
    php: "application/x-php",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = toggleIndexSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId, isIndexed } = parsed.data;

  let file = await getFileMetaById(fileId);
  if (!file) {
    // The fileId might be a relativePath for a file that exists on GitHub
    // but has no metadata yet. Try to find it in the tree and create one.
    try {
      const tree = await getRepoTree();
      const entry = tree.find((e) => e.path === fileId && e.type === "file");
      if (!entry) return fail("File not found", 404);
      const name = entry.name;
      const ext = path.extname(name).toLowerCase().replace(/^\./, "");
      const now = new Date().toISOString();
      file = {
        id: randomUUID(),
        name,
        relativePath: entry.path,
        mimeType: guessMime(ext),
        extension: ext,
        size: entry.size,
        isDirectory: false,
        isIndexed: false,
        googleIndexStatus: "UNKNOWN",
        googleLastChecked: null,
        githubSha: entry.sha,
        createdAt: now,
        updatedAt: now,
      };
      await saveFileMeta(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("indexing.toggle.lookup.error", { fileId, message });
      return fail("File not found", 404);
    }
  }
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot index a directory", 422);

  const updated = { ...file, isIndexed, updatedAt: new Date().toISOString() };
  await saveFileMeta(updated);

  await logActivity({
    userId: user.id,
    action: isIndexed ? ACTIONS.INDEX_ENABLED : ACTIONS.INDEX_DISABLED,
    target: file.relativePath,
    details: file.name,
    headers: req.headers,
  });

  return ok(
    { file: { id: updated.id, isIndexed: updated.isIndexed } },
    isIndexed ? "Indexing enabled" : "Indexing disabled",
  );
}
