// ===========================================================================
// POST /api/files/move — move a file/folder to a destination folder
// ---------------------------------------------------------------------------
// Same "read content, write to new path, delete old" pattern as rename.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  ok,
  fail,
  getServerSessionUser,
  sanitizeRelativePath,
} from "@/lib/security";
import { buildPublicUrl } from "@/lib/filesystem";
import {
  getRepoTree,
  getFileMetaById,
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
import { moveSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import path from "node:path";

export const dynamic = "force-dynamic";

const TEXT_EXT = new Set([
  "txt","html","htm","css","js","mjs","cjs","json","xml","svg","md",
  "markdown","yaml","yml","csv","log","env","ini","conf","sh","py",
  "sql","php","ts","tsx","jsx",
]);

export async function POST(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const body = await req.json().catch(() => null);
  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { fileId, destinationFolder } = parsed.data;

  const file = await getFileMetaById(fileId);
  if (!file) return fail("File not found", 404);

  const oldRel = file.relativePath;
  const dest = sanitizeRelativePath(destinationFolder);

  // Cannot move a folder into itself or one of its descendants
  if (file.isDirectory) {
    if (dest === oldRel || dest.startsWith(oldRel + "/")) {
      return fail("Cannot move a folder into itself", 422);
    }
  }

  const newRel = dest ? path.posix.join(dest, file.name) : file.name;

  if (newRel === oldRel) {
    return ok({ file: { id: file.id, relativePath: file.relativePath } }, "No change");
  }

  const tree = await getRepoTree();
  const existing = new Set(tree.map((e) => e.path));
  if (existing.has(newRel)) {
    return fail("A file with that name already exists in the destination", 409);
  }

  try {
    if (file.isDirectory) {
      const prefix = oldRel + "/";
      const toMove = tree.filter(
        (e) => e.path === oldRel || e.path.startsWith(prefix),
      );
      for (const entry of toMove) {
        if (entry.path === oldRel) continue;
        const suffix = entry.path.slice(prefix.length);
        const nextPath = newRel + "/" + suffix;
        if (entry.type === "file") {
          const text = await getFileText(entry.path);
          if (text !== null) {
            await uploadFileText(nextPath, text, `Move ${entry.path} → ${nextPath}`);
          } else {
            const bytes = await getFileBytes(entry.path);
            if (bytes) {
              await uploadFileContent(nextPath, bytes, `Move ${entry.path} → ${nextPath}`);
            }
          }
          await deleteFileContent(entry.path, entry.sha).catch(() => {});
        }
      }
      await reprefixFileMeta(oldRel, newRel);
    } else {
      const ext = file.extension.toLowerCase();
      const oldEntry = tree.find((e) => e.path === oldRel);
      const sha = oldEntry?.sha;
      if (TEXT_EXT.has(ext)) {
        const text = await getFileText(oldRel);
        if (text === null) return fail("Source file is missing on GitHub", 404);
        await uploadFileText(newRel, text, `Move ${oldRel} → ${newRel}`);
      } else {
        const bytes = await getFileBytes(oldRel);
        if (!bytes) return fail("Source file is missing on GitHub", 404);
        await uploadFileContent(newRel, bytes, `Move ${oldRel} → ${newRel}`);
      }
      await deleteFileContent(oldRel, sha ?? file.githubSha ?? undefined).catch(() => {});

      const now = new Date().toISOString();
      await deleteFileMeta(oldRel);
      await saveFileMeta({
        ...file,
        relativePath: newRel,
        updatedAt: now,
      });
    }

    invalidateTree();

    await logActivity({
      userId: user.id,
      action: ACTIONS.MOVE,
      target: newRel,
      details: `${oldRel} → ${newRel}`,
      headers: req.headers,
    });

    return ok(
      {
        file: {
          id: file.id,
          name: file.name,
          relativePath: newRel,
          url: buildPublicUrl(newRel),
        },
      },
      "Moved",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("move.error", { oldRel, newRel, message });
    return fail("Could not move: " + message, 500);
  }
}
