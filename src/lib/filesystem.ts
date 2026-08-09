// ===========================================================================
// Filesystem helpers (server-only)
// ---------------------------------------------------------------------------
// NOTE: There is no local disk storage. All files live in the GitHub repo.
// This module now provides only path sanitization + public URL building.
// The actual file CRUD happens via `lib/github-store.ts`.
// ===========================================================================

import "server-only";

import {
  sanitizeFilename,
  sanitizeRelativePath,
} from "@/lib/security";

export {
  sanitizeFilename,
  sanitizeRelativePath,
};

/**
 * Compute a unique relative path for a new file at the given destination
 * folder, deduping when a file with the same name already exists on GitHub.
 */
export async function computeUniqueRelativePath(
  destFolder: string,
  filename: string,
  existingPaths: Set<string>,
): Promise<string> {
  const safeFolder = sanitizeRelativePath(destFolder);
  const safeName = sanitizeFilename(filename);
  const candidate = safeFolder ? `${safeFolder}/${safeName}` : safeName;
  if (!existingPaths.has(candidate)) return candidate;
  const lastDot = safeName.lastIndexOf(".");
  const base = lastDot > 0 ? safeName.slice(0, lastDot) : safeName;
  const ext = lastDot > 0 ? safeName.slice(lastDot) : "";
  let i = 1;
  while (i < 10_000) {
    const next = `${base}-${i}${ext}`;
    const path = safeFolder ? `${safeFolder}/${next}` : next;
    if (!existingPaths.has(path)) return path;
    i++;
  }
  const fallback = `${base}-${Date.now()}${ext}`;
  return safeFolder ? `${safeFolder}/${fallback}` : fallback;
}

/**
 * Build the public URL for a file given its relative path. Always uses the
 * uploads route prefix and encodes each segment.
 */
export function buildPublicUrl(relativePath: string): string {
  const clean = sanitizeRelativePath(relativePath);
  if (!clean) return "/uploads";
  const encoded = clean
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/uploads/${encoded}`;
}
