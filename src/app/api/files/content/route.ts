// ===========================================================================
// GET /api/files/content?fileId=... — return text content for the editor
// ---------------------------------------------------------------------------
// Reads the file's content directly from raw.githubusercontent.com.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
  isExtensionEditable,
  getExtension,
} from "@/lib/security";
import { getFileMetaById, getFileText } from "@/lib/github-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const url = new URL(req.url);
  const fileId = url.searchParams.get("fileId");
  if (!fileId) return fail("fileId is required", 400);

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot read a directory", 400);

  const ext = getExtension(file.name);
  if (!isExtensionEditable(ext)) {
    return fail("This file type is not editable in the browser", 422);
  }

  try {
    const content = await getFileText(file.relativePath);
    if (content === null) return fail("File missing on GitHub", 404);
    return ok({
      fileId,
      name: file.name,
      extension: ext,
      content,
      size: Buffer.byteLength(content, "utf-8"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("content.read.error", { fileId, message });
    return fail("Could not read file: " + message, 500);
  }
}
