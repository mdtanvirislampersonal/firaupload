// ===========================================================================
// POST /api/files/save — write new content + create a FileVersion snapshot
// ---------------------------------------------------------------------------
// The file is updated on GitHub (PUT content). A snapshot of the previous
// content is appended to `.file-manager/versions.json`. The metadata record
// is updated with the new size + updatedAt.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
  isExtensionEditable,
  getExtension,
} from "@/lib/security";
import {
  getFileMetaById,
  saveFileMeta,
  getFileText,
  uploadFileText,
  addVersion,
} from "@/lib/github-store";
import { saveSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId, content } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);
  if (file.isDirectory) return fail("Cannot save a directory", 400);

  const ext = getExtension(file.name);
  if (!isExtensionEditable(ext)) {
    return fail("This file type is not editable", 422);
  }

  let oldContent: string | null = null;
  try {
    oldContent = await getFileText(file.relativePath);
  } catch {
    oldContent = null;
  }

  try {
    await uploadFileText(file.relativePath, content, `Save ${file.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("save.write.error", { fileId, message });
    return fail("Could not write file: " + message, 500);
  }

  const newSize = Buffer.byteLength(content, "utf-8");
  const now = new Date().toISOString();

  // Create a version snapshot of the previous content
  if (oldContent !== null) {
    try {
      await addVersion({
        id: randomUUID(),
        fileId,
        content: oldContent,
        createdBy: user.id,
        createdAt: now,
      });
    } catch (err) {
      logger.error("save.version.error", {
        fileId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await saveFileMeta({
    ...file,
    size: newSize,
    updatedAt: now,
  });

  await logActivity({
    userId: user.id,
    action: ACTIONS.EDIT,
    target: file.relativePath,
    details: `${file.name} (${newSize} bytes)`,
    headers: req.headers,
  });

  return ok(
    { fileId, size: newSize, savedAt: now },
    "Saved",
  );
}
