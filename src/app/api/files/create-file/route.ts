// ===========================================================================
// POST /api/files/create-file — create a new editable text file on GitHub
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  created,
  getServerSessionUser,
  sanitizeFilename,
  sanitizeRelativePath,
  getExtension,
  isExtensionEditable,
} from "@/lib/security";
import { computeUniqueRelativePath, buildPublicUrl } from "@/lib/filesystem";
import {
  uploadFileText,
  saveFileMeta,
  getRepoTree,
  getAllFileMeta,
  invalidateTree,
} from "@/lib/github-store";
import { createFileSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = createFileSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { name, folder, content } = parsed.data;

  const safeName = sanitizeFilename(name);
  const ext = getExtension(safeName);
  if (!isExtensionEditable(ext)) {
    return fail(
      `Files with extension ".${ext}" are not editable and cannot be created here. Allowed: txt, html, css, js, json, xml, php, md, etc.`,
      422,
    );
  }

  const safeFolder = sanitizeRelativePath(folder);

  try {
    const tree = await getRepoTree();
    const meta = await getAllFileMeta();
    const existing = new Set<string>(tree.map((e) => e.path));
    for (const k of Object.keys(meta)) existing.add(k);

    const relativePath = await computeUniqueRelativePath(safeFolder, safeName, existing);
    const text = content || "";
    const { sha } = await uploadFileText(relativePath, text, `Create ${safeName}`);
    invalidateTree();

    const mimeType =
      ext === "json" ? "application/json"
      : ext === "html" || ext === "htm" ? "text/html"
      : ext === "css" ? "text/css"
      : ext === "js" ? "text/javascript"
      : ext === "xml" || ext === "svg" ? "application/xml"
      : "text/plain";
    const size = Buffer.byteLength(text, "utf-8");
    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      name: safeName,
      relativePath,
      mimeType,
      extension: ext,
      size,
      isDirectory: false,
      isIndexed: false,
      googleIndexStatus: "UNKNOWN",
      googleLastChecked: null,
      githubSha: sha,
      createdAt: now,
      updatedAt: now,
    };
    await saveFileMeta(record);

    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATE_FILE,
      target: relativePath,
      details: `${safeName} (${size} bytes)`,
      headers: req.headers,
    });

    return created(
      {
        file: {
          id: record.id,
          name: record.name,
          relativePath: record.relativePath,
          url: buildPublicUrl(record.relativePath),
          extension: record.extension,
          size: record.size,
          createdAt: record.createdAt,
        },
      },
      "File created",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("createFile.error", { message });
    if (message.includes("Path traversal")) {
      return fail("Invalid path", 400);
    }
    return fail("Could not create file: " + message, 500);
  }
}
