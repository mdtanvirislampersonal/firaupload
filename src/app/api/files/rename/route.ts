// ===========================================================================
// POST /api/files/rename — rename a file or folder on GitHub + update metadata
// ---------------------------------------------------------------------------
// For files: GitHub Contents API doesn't have a native "rename", so we
//   read the file's current content, PUT it to the new path, then DELETE
//   the old path. For text files we use raw; for binary we use the API.
// For folders: we walk the repo tree and rename every descendant entry.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
  sanitizeFilename,
  sanitizeRelativePath,
  getExtension,
} from "@/lib/security";
import { buildPublicUrl } from "@/lib/filesystem";
import {
  getRepoTree,
  getFileMetaById,
  getFileMeta,
  saveFileMeta,
  reprefixFileMeta,
  deleteFileMeta,
  uploadFileText,
  uploadFileContent,
  deleteFileContent,
  getFileBytes,
  getFileText,
  invalidateTree,
} from "@/lib/github-store";
import { renameSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId, newName } = parsed.data;
  const safeNewName = sanitizeFilename(newName);

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);

  const oldRel = file.relativePath;
  const parent = path.posix.dirname(oldRel) === "." ? "" : path.posix.dirname(oldRel);
  const newRel = sanitizeRelativePath(path.posix.join(parent, safeNewName));

  if (newRel === oldRel) {
    return ok({ file: { id: file.id, relativePath: file.relativePath } }, "No change");
  }

  // Check for collision in the repo tree
  const tree = await getRepoTree();
  const existing = new Set(tree.map((e) => e.path));
  if (existing.has(newRel)) {
    return fail("A file with that name already exists", 409);
  }

  try {
    if (file.isDirectory) {
      // Rename every descendant entry. Walk the tree for paths starting
      // with oldRel + "/" or equal to oldRel.
      const prefix = oldRel + "/";
      const toRename = tree.filter(
        (e) => e.path === oldRel || e.path.startsWith(prefix),
      );
      // For folders there's no real "file" at oldRel — only the descendants
      // matter. We rename each descendant in turn.
      for (const entry of toRename) {
        if (entry.path === oldRel) continue; // skip the folder marker itself
        const suffix = entry.path.slice(prefix.length);
        const nextPath = newRel + "/" + suffix;
        // Read content, write to new path, delete old.
        if (entry.type === "file") {
          // Heuristic: try text first, fall back to bytes.
          const text = await getFileText(entry.path);
          if (text !== null) {
            await uploadFileText(nextPath, text, `Rename ${entry.path} → ${nextPath}`);
          } else {
            const bytes = await getFileBytes(entry.path);
            if (bytes) {
              await uploadFileContent(nextPath, bytes, `Rename ${entry.path} → ${nextPath}`);
            }
          }
          await deleteFileContent(entry.path, entry.sha).catch(() => {});
        }
      }
      await reprefixFileMeta(oldRel, newRel);
    } else {
      // Single file rename: read content, write new, delete old.
      const ext = getExtension(safeNewName);
      const isText = [
        "txt","html","htm","css","js","mjs","cjs","json","xml","svg","md",
        "markdown","yaml","yml","csv","log","env","ini","conf","sh","py",
        "sql","php","ts","tsx","jsx",
      ].includes(ext);
      const oldEntry = tree.find((e) => e.path === oldRel);
      const sha = oldEntry?.sha;
      if (isText) {
        const text = await getFileText(oldRel);
        if (text === null) return fail("Source file is missing on GitHub", 404);
        await uploadFileText(newRel, text, `Rename ${oldRel} → ${newRel}`);
      } else {
        const bytes = await getFileBytes(oldRel);
        if (!bytes) return fail("Source file is missing on GitHub", 404);
        await uploadFileContent(newRel, bytes, `Rename ${oldRel} → ${newRel}`);
      }
      await deleteFileContent(oldRel, sha ?? file.githubSha ?? undefined).catch(() => {});

      // Update metadata: delete old entry, create new with same id.
      const now = new Date().toISOString();
      await deleteFileMeta(oldRel);
      await saveFileMeta({
        ...file,
        name: safeNewName,
        relativePath: newRel,
        extension: ext,
        updatedAt: now,
      });
    }

    invalidateTree();

    await logActivity({
      userId: user.id,
      action: ACTIONS.RENAME,
      target: newRel,
      details: `${oldRel} → ${newRel}`,
      headers: req.headers,
    });

    return ok(
      {
        file: {
          id: file.id,
          name: safeNewName,
          relativePath: newRel,
          url: buildPublicUrl(newRel),
        },
      },
      "Renamed",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("rename.error", { oldRel, newRel, message });
    return fail("Could not rename: " + message, 500);
  }
}
