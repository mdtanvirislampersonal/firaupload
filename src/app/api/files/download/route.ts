// ===========================================================================
// GET /api/files/download?fileId=... — stream a file as an attachment
// ---------------------------------------------------------------------------
// Fetches the file from raw.githubusercontent.com and streams it back to
// the browser with Content-Disposition: attachment.
// ===========================================================================

import { NextRequest } from "next/server";
import { fail, getServerSessionUser, getExtension } from "@/lib/security";
import { getFileMetaById, getFileBytes } from "@/lib/github-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const MIME_BY_EXTENSION: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  cjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  zip: "application/zip",
  gz: "application/gzip",
};

export async function GET(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const url = new URL(req.url);
  const fileId = url.searchParams.get("fileId");
  if (!fileId) return fail("fileId is required", 400);

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot download a directory", 400);

  const bytes = await getFileBytes(file.relativePath);
  if (!bytes) return fail("File missing on GitHub", 404);

  const ext = getExtension(file.name);
  const contentType = MIME_BY_EXTENSION[ext] || file.mimeType || "application/octet-stream";
  const filename = file.name.replace(/["\\]/g, "_");

  logger.info("download", { fileId, name: file.name });

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
