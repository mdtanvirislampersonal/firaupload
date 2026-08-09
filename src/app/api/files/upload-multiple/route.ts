// ===========================================================================
// POST /api/files/upload-multiple — multi-file upload (multipart/form-data)
// ---------------------------------------------------------------------------
// Each file is committed directly to GitHub. Metadata is recorded in
// `.file-manager/metadata.json`. No local disk is used.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
  isAllowedMime,
  isWithinUploadSize,
  sanitizeFilename,
  sanitizeRelativePath,
  getExtension,
} from "@/lib/security";
import { computeUniqueRelativePath, buildPublicUrl } from "@/lib/filesystem";
import {
  uploadFileContent,
  saveFileMeta,
  getRepoTree,
  getAllFileMeta,
  invalidateTree,
} from "@/lib/github-store";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

function guessMime(ext: string, declared: string): string {
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
  return map[ext.toLowerCase()] || declared || "application/octet-stream";
}

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid form data", 400);
  }

  const folderRaw = (form.get("folder") as string | null) || "";
  const isIndexed =
    form.get("isIndexed") === "true" || form.get("isIndexed") === "on";
  const folder = sanitizeRelativePath(folderRaw);

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return fail("No files provided", 400);
  }

  // Build the set of existing paths ONCE so dedupe works across the batch.
  const tree = await getRepoTree();
  const meta = await getAllFileMeta();
  const existing = new Set<string>(tree.map((e) => e.path));
  for (const k of Object.keys(meta)) existing.add(k);

  const results: Array<{
    success: boolean;
    name: string;
    url?: string;
    id?: string;
    size?: number;
    error?: string;
  }> = [];

  for (const file of files) {
    try {
      if (file.size === 0) {
        results.push({ success: false, name: file.name, error: "empty" });
        continue;
      }
      if (!isWithinUploadSize(file.size)) {
        results.push({
          success: false,
          name: file.name,
          error: `exceeds ${Math.floor(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024)} MB`,
        });
        continue;
      }
      const safeName = sanitizeFilename(file.name);
      const ext = getExtension(safeName);
      const declaredMime = file.type || "application/octet-stream";
      if (!isAllowedMime(declaredMime) && declaredMime !== "application/octet-stream") {
        results.push({ success: false, name: file.name, error: `MIME ${declaredMime} not allowed` });
        continue;
      }

      const relativePath = await computeUniqueRelativePath(folder, safeName, existing);
      existing.add(relativePath); // reserve for subsequent iterations
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { sha } = await uploadFileContent(relativePath, buffer, `Upload ${safeName}`);

      const now = new Date().toISOString();
      const record = {
        id: randomUUID(),
        name: safeName,
        relativePath,
        mimeType: guessMime(ext, declaredMime),
        extension: ext,
        size: buffer.length,
        isDirectory: false,
        isIndexed,
        googleIndexStatus: "UNKNOWN",
        googleLastChecked: null,
        githubSha: sha,
        createdAt: now,
        updatedAt: now,
      };
      await saveFileMeta(record);

      await logActivity({
        userId: user.id,
        action: ACTIONS.UPLOAD_MULTIPLE,
        target: relativePath,
        details: `${safeName} (${buffer.length} bytes)`,
        headers: req.headers,
      });

      results.push({
        success: true,
        name: safeName,
        url: buildPublicUrl(record.relativePath),
        id: record.id,
        size: buffer.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("upload.multi.error", { name: file.name, message });
      results.push({ success: false, name: file.name, error: message });
    }
  }

  invalidateTree();
  const succeeded = results.filter((r) => r.success).length;
  return ok(
    { files: results, succeeded, total: results.length },
    `${succeeded}/${results.length} uploaded`,
  );
}
