// ===========================================================================
// GitHub integration facade (server-only)
// ---------------------------------------------------------------------------
// All file storage now lives on GitHub directly. This module provides the
// high-level "sync" / "status" entry points expected by the API routes.
// The low-level GitHub API calls live in `lib/github-store.ts`.
// ===========================================================================

import "server-only";

import {
  githubConfigured,
  githubEnabled,
  pingGithub,
  getRepoTree,
  getFileMetaById,
  saveFileMeta,
  uploadFileContent,
  deleteFileContent,
  repoConfig,
  invalidateTree,
  type FileMeta,
} from "@/lib/github-store";
import { logger } from "@/lib/logger";

export type GithubStatus = {
  enabled: boolean;
  configured: boolean;
  owner: string;
  repo: string;
  branch: string;
  reachable?: boolean;
  error?: string;
};

export async function getGithubStatus(): Promise<GithubStatus> {
  const c = repoConfig();
  const configured = githubConfigured();
  if (!githubEnabled() || !configured) {
    return {
      enabled: githubEnabled(),
      configured,
      owner: c.owner,
      repo: c.repo,
      branch: c.branch,
    };
  }
  const ping = await pingGithub();
  return {
    enabled: true,
    configured: true,
    owner: c.owner,
    repo: c.repo,
    branch: c.branch,
    reachable: ping.reachable,
    error: ping.error,
  };
}

/**
 * "Sync" a single file to GitHub. Since files now LIVE on GitHub, this is
 * essentially a no-op that confirms the file exists remotely and records
 * its current SHA on the metadata record.
 */
export async function syncFileToGithub(fileId: string): Promise<{
  ok: boolean;
  sha?: string;
  conflict?: boolean;
  error?: string;
}> {
  if (!githubEnabled()) return { ok: false, error: "GitHub sync is disabled" };
  const file = await getFileMetaById(fileId);
  if (!file) return { ok: false, error: "File not found" };
  if (file.isDirectory) return { ok: false, error: "Cannot sync a directory" };

  try {
    const tree = await getRepoTree();
    const entry = tree.find((e) => e.path === file.relativePath);
    if (!entry) {
      return { ok: false, error: "File does not exist on GitHub" };
    }
    await saveFileMeta({
      ...file,
      githubSha: entry.sha,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true, sha: entry.sha };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("github.sync.error", { fileId, message });
    return { ok: false, error: message };
  }
}

/**
 * "Sync all" — refresh SHAs for all known file records from the repo tree.
 */
export async function syncAllFiles(): Promise<{
  total: number;
  success: number;
  failed: number;
  conflicts: number;
  errors: { fileId: string; relativePath: string; error: string }[];
}> {
  if (!githubEnabled()) {
    return { total: 0, success: 0, failed: 0, conflicts: 0, errors: [] };
  }
  invalidateTree();
  const tree = await getRepoTree();
  const treeMap = new Map(tree.map((e) => [e.path, e.sha]));
  // Import here to avoid circular import at module load
  const { getAllFileMeta } = await import("@/lib/github-store");
  const all = await getAllFileMeta();
  const files = Object.values(all).filter((f) => !f.isDirectory);
  let success = 0;
  let failed = 0;
  const errors: { fileId: string; relativePath: string; error: string }[] = [];
  const updates: FileMeta[] = [];
  for (const f of files) {
    const sha = treeMap.get(f.relativePath);
    if (sha) {
      updates.push({ ...f, githubSha: sha });
      success++;
    } else {
      failed++;
      errors.push({
        fileId: f.id,
        relativePath: f.relativePath,
        error: "Not found on GitHub",
      });
    }
  }
  if (updates.length > 0) {
    const { saveManyFileMeta } = await import("@/lib/github-store");
    await saveManyFileMeta(updates);
  }
  return {
    total: files.length,
    success,
    failed,
    conflicts: 0,
    errors,
  };
}

/**
 * Upload binary content for a file directly to GitHub. Used by the upload
 * routes — the file is committed to the repo AND its metadata is recorded.
 */
export async function uploadToGithub(
  repoPath: string,
  bytes: Uint8Array,
  message: string,
): Promise<{ sha: string }> {
  return uploadFileContent(repoPath, bytes, message);
}

/**
 * Update a file's content on GitHub.
 */
export async function updateGithubFile(
  repoPath: string,
  bytes: Uint8Array,
  message: string,
): Promise<{ sha: string }> {
  return uploadFileContent(repoPath, bytes, message);
}

/**
 * Delete a file from GitHub. Does NOT touch the metadata record (the caller
 * is responsible for that).
 */
export async function deleteGithubFile(repoPath: string, knownSha?: string): Promise<void> {
  await deleteFileContent(repoPath, knownSha);
}

/**
 * Delete a file's GitHub content AND clear its metadata's SHA.
 */
export async function deleteFileFromGithub(fileId: string): Promise<{ ok: boolean; error?: string }> {
  if (!githubEnabled()) return { ok: false, error: "GitHub sync is disabled" };
  const file = await getFileMetaById(fileId);
  if (!file) return { ok: false, error: "File not found" };
  try {
    await deleteFileContent(file.relativePath, file.githubSha ?? undefined);
    await saveFileMeta({
      ...file,
      githubSha: null,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("github.delete.error", { fileId, message });
    return { ok: false, error: message };
  }
}
