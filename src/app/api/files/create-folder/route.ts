// ===========================================================================
// POST /api/files/create-folder — create a folder on GitHub
// ---------------------------------------------------------------------------
// GitHub doesn't track empty directories, so we commit a `.gitkeep` file
// inside the new folder. We also record a metadata entry so the folder can
// carry isIndexed / googleStatus etc.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  created,
  getServerSessionUser,
  sanitizeFilename,
  sanitizeRelativePath,
} from "@/lib/security";
import { computeUniqueRelativePath } from "@/lib/filesystem";
import {
  createDirectory,
  saveFileMeta,
  getRepoTree,
  getAllFileMeta,
  invalidateTree,
} from "@/lib/github-store";
import { createFolderSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { name, folder } = parsed.data;

  const safeName = sanitizeFilename(name);
  const safeFolder = sanitizeRelativePath(folder);

  try {
    const tree = await getRepoTree();
    const meta = await getAllFileMeta();
    const existing = new Set<string>(tree.map((e) => e.path));
    for (const k of Object.keys(meta)) existing.add(k);

    const relativePath = await computeUniqueRelativePath(safeFolder, safeName, existing);

    // Check if folder already exists
    if (existing.has(relativePath)) {
      return fail("Folder already exists", 409);
    }

    await createDirectory(relativePath);
    invalidateTree();

    const now = new Date().toISOString();
    const record = {
      id: randomUUID(),
      name: safeName,
      relativePath,
      mimeType: "inode/directory",
      extension: "",
      size: 0,
      isDirectory: true,
      isIndexed: false,
      googleIndexStatus: "UNKNOWN",
      googleLastChecked: null,
      githubSha: null,
      createdAt: now,
      updatedAt: now,
    };
    await saveFileMeta(record);

    await logActivity({
      userId: user.id,
      action: ACTIONS.CREATE_FOLDER,
      target: relativePath,
      details: safeName,
      headers: req.headers,
    });

    return created(
      {
        folder: {
          id: record.id,
          name: record.name,
          relativePath: record.relativePath,
          createdAt: record.createdAt,
        },
      },
      "Folder created",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("createFolder.error", { message });
    if (message.includes("Path traversal")) {
      return fail("Invalid path", 400);
    }
    return fail("Could not create folder: " + message, 500);
  }
}
