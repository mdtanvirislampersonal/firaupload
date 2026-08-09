// ===========================================================================
// GitHub Store — generic JSON-backed key-value store on GitHub
// ---------------------------------------------------------------------------
// This module implements a tiny "database" on top of a GitHub repository.
// State lives in JSON / JSONL files under the `.file-manager/` directory in
// the configured repository. There is NO local database — GitHub is the
// single source of truth.
//
// Layout on GitHub:
//   .file-manager/
//     metadata.json     # File metadata (indexing flags, google status, sha, ...)
//     users.json        # Admin users (bcrypt-hashed passwords)
//     activity.jsonl    # Append-only activity log (one JSON object per line)
//     versions.json     # File version snapshots (keyed by fileId)
//
// All writes go through the GitHub Contents API (PUT with base64 content).
// All reads use raw.githubusercontent.com (fast, CDN-backed, no API quota).
// Metadata is cached in-memory for a short TTL to avoid hammering GitHub.
// ===========================================================================

import "server-only";

import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com";
const RAW_BASE = "https://raw.githubusercontent.com";

const META_DIR = ".file-manager";
const METADATA_FILE = `${META_DIR}/metadata.json`;
const USERS_FILE = `${META_DIR}/users.json`;
const ACTIVITY_FILE = `${META_DIR}/activity.jsonl`;
const VERSIONS_FILE = `${META_DIR}/versions.json`;

const CACHE_TTL_MS = 5_000; // 5 seconds — short so writes are visible quickly

function config() {
  return {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPOSITORY || "",
    branch: process.env.GITHUB_BRANCH || "main",
    token: process.env.GITHUB_TOKEN || "",
  };
}

export function githubEnabled(): boolean {
  return process.env.GITHUB_ENABLED === "true";
}

export function githubConfigured(): boolean {
  const c = config();
  return Boolean(c.owner && c.repo && c.token);
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "file-manager-nextjs",
  };
}

function encodePath(p: string): string {
  const clean = p.replace(/^\/+/, "");
  return clean
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function rawUrl(path: string): string {
  const c = config();
  // Add a cache-buster so we always get the freshest content from
  // raw.githubusercontent.com (which sits behind a CDN that can lag by
  // several minutes after a write). Using a second-resolution timestamp
  // keeps it stable within the same second so the 5s in-memory cache still
  // dedupes correctly.
  const buster = Math.floor(Date.now() / 1000);
  return `${RAW_BASE}/${c.owner}/${c.repo}/${c.branch}/${encodePath(path)}?t=${buster}`;
}

function rawHeaders(): Record<string, string> {
  // For private repos, raw.githubusercontent.com requires auth.
  const c = config();
  const h: Record<string, string> = {
    "User-Agent": "file-manager-nextjs",
  };
  if (c.token) {
    h.Authorization = `Bearer ${c.token}`;
  }
  return h;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileMeta {
  id: string;
  name: string;
  relativePath: string;
  mimeType: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  isIndexed: boolean;
  googleIndexStatus: string;
  googleLastChecked: string | null;
  githubSha: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
}

interface MetadataShape {
  files: Record<string, FileMeta>; // keyed by relativePath
}

interface UsersShape {
  users: UserRecord[];
}

interface VersionsShape {
  versions: Record<string, FileVersion[]>; // keyed by fileId
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function invalidate(key: string): void {
  cache.delete(key);
}

// ---------------------------------------------------------------------------
// Low-level GitHub Contents API helpers
// ---------------------------------------------------------------------------

async function getRemoteSha(path: string): Promise<string | null> {
  const c = config();
  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(c.branch)}`;
  const res = await fetch(url, {
    headers: authHeaders(c.token),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch remote file ${path}: ${(body as { message?: string }).message || res.status}`,
    );
  }
  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

async function putRemote(
  path: string,
  contentBase64: string,
  message: string,
  knownSha?: string,
): Promise<string> {
  const c = config();
  let sha = knownSha;
  if (!sha) {
    sha = await getRemoteSha(path).catch(() => null);
  }
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: c.branch,
  };
  if (sha) body.sha = sha;

  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...authHeaders(c.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 429 || res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub rate limit: ${(data as { message?: string }).message || res.status}`,
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub write failed for ${path}: ${(data as { message?: string }).message || res.status}`,
    );
  }
  const data = (await res.json()) as { content?: { sha?: string } };
  return data.content?.sha ?? "";
}

async function deleteRemote(path: string, sha?: string): Promise<void> {
  const c = config();
  const resolvedSha = sha ?? (await getRemoteSha(path).catch(() => null));
  if (!resolvedSha) return;
  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...authHeaders(c.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Delete ${path}`,
      sha: resolvedSha,
      branch: c.branch,
    }),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub delete failed for ${path}: ${(data as { message?: string }).message || res.status}`,
    );
  }
}

/**
 * Read a JSON file from the repo via the GitHub Contents API (not raw).
 * We use the API instead of raw.githubusercontent.com because the raw URL
 * sits behind a CDN that can lag by several minutes after a write, leading
 * to stale reads immediately after a mutation. The API always returns the
 * freshest content. Returns null when the file does not exist (404).
 */
async function readJson<T>(path: string): Promise<T | null> {
  const c = config();
  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(c.branch)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: authHeaders(c.token),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub read failed for ${path}: ${res.status}`);
  }
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  const text =
    data.encoding === "base64"
      ? Buffer.from(data.content, "base64").toString("utf-8")
      : data.content;
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Read a raw text file from the repo. Uses raw.githubusercontent.com with a
 * cache-buster for speed; falls back to the Contents API on stale reads.
 */
async function readText(path: string): Promise<string | null> {
  const res = await fetch(rawUrl(path), {
    cache: "no-store",
    headers: rawHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub read failed for ${path}: ${res.status}`);
  }
  return res.text();
}

/**
 * Read a binary file from the repo via raw.githubusercontent.com.
 */
async function readBytes(path: string): Promise<Uint8Array | null> {
  const res = await fetch(rawUrl(path), {
    cache: "no-store",
    headers: rawHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub read failed for ${path}: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function writeJson<T>(
  path: string,
  data: T,
  message: string,
): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const b64 = Buffer.from(json, "utf-8").toString("base64");
  await putRemote(path, b64, message);
}

// ---------------------------------------------------------------------------
// Metadata (file records)
// ---------------------------------------------------------------------------

const META_CACHE_KEY = "github:metadata";

export async function getAllFileMeta(): Promise<Record<string, FileMeta>> {
  const cached = getCached<Record<string, FileMeta>>(META_CACHE_KEY);
  if (cached) return cached;

  if (!githubConfigured()) return {};

  const data = await readJson<MetadataShape>(METADATA_FILE).catch(() => null);
  const files = data?.files ?? {};
  setCached(META_CACHE_KEY, files);
  return files;
}

export async function getFileMeta(relativePath: string): Promise<FileMeta | null> {
  const all = await getAllFileMeta();
  return all[relativePath] ?? null;
}

export async function getFileMetaById(id: string): Promise<FileMeta | null> {
  const all = await getAllFileMeta();
  // First try by id
  for (const k of Object.keys(all)) {
    if (all[k].id === id) return all[k];
  }
  // Fallback: the list endpoint uses relativePath as id when no metadata
  // exists yet, so accept a relativePath match too.
  if (id in all) return all[id];
  return null;
}

export async function saveFileMeta(meta: FileMeta): Promise<void> {
  const all = await getAllFileMeta();
  all[meta.relativePath] = meta;
  await writeJson<MetadataShape>(
    METADATA_FILE,
    { files: all },
    `Update metadata for ${meta.relativePath}`,
  );
  invalidate(META_CACHE_KEY);
}

export async function saveManyFileMeta(entries: FileMeta[]): Promise<void> {
  if (entries.length === 0) return;
  const all = await getAllFileMeta();
  for (const e of entries) all[e.relativePath] = e;
  await writeJson<MetadataShape>(
    METADATA_FILE,
    { files: all },
    `Bulk update ${entries.length} metadata entries`,
  );
  invalidate(META_CACHE_KEY);
}

export async function deleteFileMeta(relativePath: string): Promise<void> {
  const all = await getAllFileMeta();
  if (!(relativePath in all)) return;
  delete all[relativePath];
  await writeJson<MetadataShape>(
    METADATA_FILE,
    { files: all },
    `Remove metadata for ${relativePath}`,
  );
  invalidate(META_CACHE_KEY);
}

/**
 * Remove metadata entries whose relativePath starts with `prefix` (used when
 * deleting a folder). Returns the list of removed entries.
 */
export async function deleteFileMetaByPrefix(
  prefix: string,
): Promise<FileMeta[]> {
  const all = await getAllFileMeta();
  const removed: FileMeta[] = [];
  const p = prefix.endsWith("/") ? prefix : prefix + "/";
  for (const k of Object.keys(all)) {
    if (k === prefix || k.startsWith(p)) {
      removed.push(all[k]);
      delete all[k];
    }
  }
  if (removed.length > 0) {
    await writeJson<MetadataShape>(
      METADATA_FILE,
      { files: all },
      `Remove ${removed.length} metadata entries under ${prefix}`,
    );
    invalidate(META_CACHE_KEY);
  }
  return removed;
}

/**
 * Replace the prefix on metadata entries when a folder is renamed/moved.
 */
export async function reprefixFileMeta(
  oldPrefix: string,
  newPrefix: string,
): Promise<FileMeta[]> {
  const all = await getAllFileMeta();
  const updated: FileMeta[] = [];
  const p = oldPrefix.endsWith("/") ? oldPrefix : oldPrefix + "/";
  const np = newPrefix.endsWith("/") ? newPrefix : newPrefix + "/";
  for (const k of Object.keys(all)) {
    if (k === oldPrefix) {
      const m = all[k];
      const next = { ...m, relativePath: newPrefix, updatedAt: new Date().toISOString() };
      delete all[k];
      all[newPrefix] = next;
      updated.push(next);
    } else if (k.startsWith(p)) {
      const m = all[k];
      const suffix = k.slice(p.length);
      const nextRel = np + suffix;
      const next = { ...m, relativePath: nextRel, updatedAt: new Date().toISOString() };
      delete all[k];
      all[nextRel] = next;
      updated.push(next);
    }
  }
  if (updated.length > 0) {
    await writeJson<MetadataShape>(
      METADATA_FILE,
      { files: all },
      `Rename/move ${updated.length} entries from ${oldPrefix} to ${newPrefix}`,
    );
    invalidate(META_CACHE_KEY);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const USERS_CACHE_KEY = "github:users";

export async function getAllUsers(): Promise<UserRecord[]> {
  const cached = getCached<UserRecord[]>(USERS_CACHE_KEY);
  if (cached) return cached;

  if (!githubConfigured()) return [];

  const data = await readJson<UsersShape>(USERS_FILE).catch(() => null);
  const users = data?.users ?? [];
  setCached(USERS_CACHE_KEY, users);
  return users;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const users = await getAllUsers();
  return users.find((u) => u.username === username) ?? null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function countAdmins(): Promise<number> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "ADMIN").length;
}

export async function createUser(user: UserRecord): Promise<void> {
  const users = await getAllUsers();
  users.push(user);
  await writeJson<UsersShape>(
    USERS_FILE,
    { users },
    `Create admin ${user.username}`,
  );
  invalidate(USERS_CACHE_KEY);
}

// ---------------------------------------------------------------------------
// Activity log (append-only JSONL)
// ---------------------------------------------------------------------------

const ACTIVITY_CACHE_KEY = "github:activity";
const ACTIVITY_CACHE_TTL = 5_000;

/**
 * Read the entire activity log. Cached briefly. Returns newest-first.
 */
export async function getAllActivity(): Promise<ActivityEntry[]> {
  const cached = getCached<ActivityEntry[]>(ACTIVITY_CACHE_KEY);
  if (cached) return cached;

  if (!githubConfigured()) return [];

  const text = await readText(ACTIVITY_FILE).catch(() => null);
  if (!text) {
    setCached(ACTIVITY_CACHE_KEY, [], ACTIVITY_CACHE_TTL);
    return [];
  }
  const entries: ActivityEntry[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as ActivityEntry);
    } catch {
      /* skip malformed line */
    }
  }
  // newest-first
  entries.reverse();
  setCached(ACTIVITY_CACHE_KEY, entries, ACTIVITY_CACHE_TTL);
  return entries;
}

export async function appendActivity(entry: ActivityEntry): Promise<void> {
  // We need to append a line. GitHub's Contents API doesn't support append,
  // so we read current content, append, and write back.
  const existing = await readText(ACTIVITY_FILE).catch(() => null);
  const next = (existing ? existing.trimEnd() + "\n" : "") + JSON.stringify(entry) + "\n";
  const b64 = Buffer.from(next, "utf-8").toString("base64");
  await putRemote(ACTIVITY_FILE, b64, `Log: ${entry.action} ${entry.target ?? ""}`);
  invalidate(ACTIVITY_CACHE_KEY);
}

// ---------------------------------------------------------------------------
// File versions
// ---------------------------------------------------------------------------

const VERSIONS_CACHE_KEY = "github:versions";

export async function getVersionsForFile(fileId: string): Promise<FileVersion[]> {
  const cached = getCached<VersionsShape>(VERSIONS_CACHE_KEY);
  let data: VersionsShape | null;
  if (cached) {
    data = cached;
  } else {
    data = await readJson<VersionsShape>(VERSIONS_FILE).catch(() => null);
    if (data) setCached(VERSIONS_CACHE_KEY, data);
  }
  return data?.versions?.[fileId] ?? [];
}

export async function addVersion(version: FileVersion): Promise<void> {
  const cached = getCached<VersionsShape>(VERSIONS_CACHE_KEY);
  let data: VersionsShape;
  if (cached) {
    data = cached;
  } else {
    data = (await readJson<VersionsShape>(VERSIONS_FILE).catch(() => null)) ?? {
      versions: {},
    };
  }
  if (!data.versions) data.versions = {};
  if (!data.versions[version.fileId]) data.versions[version.fileId] = [];
  data.versions[version.fileId].push(version);
  // cap at 50 versions per file to keep the file manageable
  if (data.versions[version.fileId].length > 50) {
    data.versions[version.fileId] = data.versions[version.fileId].slice(-50);
  }
  await writeJson<VersionsShape>(
    VERSIONS_FILE,
    data,
    `Add version for ${version.fileId}`,
  );
  invalidate(VERSIONS_CACHE_KEY);
}

export async function deleteVersionsForFile(fileId: string): Promise<void> {
  const cached = getCached<VersionsShape>(VERSIONS_CACHE_KEY);
  let data: VersionsShape;
  if (cached) {
    data = cached;
  } else {
    data = (await readJson<VersionsShape>(VERSIONS_FILE).catch(() => null)) ?? {
      versions: {},
    };
  }
  if (data.versions && data.versions[fileId]) {
    delete data.versions[fileId];
    await writeJson<VersionsShape>(
      VERSIONS_FILE,
      data,
      `Delete versions for ${fileId}`,
    );
    invalidate(VERSIONS_CACHE_KEY);
  }
}

// ---------------------------------------------------------------------------
// Generic file content operations (the actual uploaded files)
// ---------------------------------------------------------------------------

/**
 * Upload (create or update) a file at the given repo path with binary content.
 */
export async function uploadFileContent(
  repoPath: string,
  bytes: Uint8Array,
  message: string,
): Promise<{ sha: string }> {
  const b64 = Buffer.from(bytes).toString("base64");
  const sha = await putRemote(repoPath, b64, message);
  return { sha };
}

/**
 * Upload (create or update) a text file at the given repo path.
 */
export async function uploadFileText(
  repoPath: string,
  text: string,
  message: string,
): Promise<{ sha: string }> {
  const b64 = Buffer.from(text, "utf-8").toString("base64");
  const sha = await putRemote(repoPath, b64, message);
  return { sha };
}

/**
 * Fetch raw bytes for a file at the given repo path.
 */
export async function getFileBytes(repoPath: string): Promise<Uint8Array | null> {
  return readBytes(repoPath);
}

/**
 * Fetch raw text for a file at the given repo path.
 */
export async function getFileText(repoPath: string): Promise<string | null> {
  return readText(repoPath);
}

/**
 * Delete a file from the repo at the given path.
 */
export async function deleteFileContent(
  repoPath: string,
  knownSha?: string,
): Promise<void> {
  await deleteRemote(repoPath, knownSha);
}

/**
 * Create an empty directory on GitHub by committing a `.gitkeep` file inside
 * it. GitHub doesn't track empty dirs, so this is the canonical workaround.
 */
export async function createDirectory(repoPath: string): Promise<void> {
  const keepPath = repoPath ? `${repoPath}/.gitkeep` : ".gitkeep";
  await uploadFileText(keepPath, "", `Create directory ${repoPath || "/"}`);
}

// ---------------------------------------------------------------------------
// GitHub Contents API listing (for browsing the repo as a file tree)
// ---------------------------------------------------------------------------

export interface RepoEntry {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size: number;
  sha: string;
}

/**
 * List immediate children of a directory in the repo.
 */
export async function listRepoEntries(repoPath: string): Promise<RepoEntry[]> {
  const c = config();
  const cleanPath = repoPath.replace(/^\/+/, "");
  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(cleanPath)}?ref=${encodeURIComponent(c.branch)}`;
  const res = await fetch(url, {
    headers: authHeaders(c.token),
    cache: "no-store",
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to list ${repoPath}: ${(body as { message?: string }).message || res.status}`,
    );
  }
  const data = (await res.json()) as RepoEntry | RepoEntry[];
  if (Array.isArray(data)) return data;
  return [data];
}

/**
 * Recursively walk the repo and return every File entry. Cached for 10s.
 * Used by the file list / search / stats endpoints.
 */
const TREE_CACHE_KEY = "github:tree";
const TREE_TTL_MS = 10_000;

export async function getRepoTree(): Promise<RepoEntry[]> {
  const cached = getCached<RepoEntry[]>(TREE_CACHE_KEY);
  if (cached) return cached;

  const c = config();
  // Use the Git Trees API with recursive=1 — single API call, returns everything.
  const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/git/trees/${encodeURIComponent(c.branch)}?recursive=1`;
  const res = await fetch(url, {
    headers: authHeaders(c.token),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch repo tree: ${(body as { message?: string }).message || res.status}`,
    );
  }
  const data = (await res.json()) as {
    tree: Array<{
      path: string;
      type: string;
      size?: number;
      sha: string;
    }>;
  };
  const entries: RepoEntry[] = (data.tree || [])
    .filter((t) => t.type === "blob" || t.type === "tree")
    .map((t) => ({
      name: t.path.split("/").pop() || t.path,
      path: t.path,
      type: t.type === "tree" ? "dir" : "file",
      size: t.size ?? 0,
      sha: t.sha,
    }));
  setCached(TREE_CACHE_KEY, entries, TREE_TTL_MS);
  return entries;
}

export function invalidateTree(): void {
  cache.delete(TREE_CACHE_KEY);
}

/**
 * Check whether a path exists in the repo (file or dir).
 */
export async function repoPathExists(repoPath: string): Promise<boolean> {
  const entries = await getRepoTree();
  const clean = repoPath.replace(/^\/+/, "");
  return entries.some((e) => e.path === clean);
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export async function pingGithub(): Promise<{
  reachable: boolean;
  error?: string;
}> {
  const c = config();
  if (!c.token || !c.owner || !c.repo) {
    return { reachable: false, error: "Not configured" };
  }
  try {
    const res = await fetch(`${GITHUB_API}/repos/${c.owner}/${c.repo}`, {
      headers: authHeaders(c.token),
      cache: "no-store",
    });
    if (res.status === 401) return { reachable: false, error: "Bad credentials" };
    if (res.status === 404) return { reachable: false, error: "Repository not found" };
    if (!res.ok) return { reachable: false, error: `HTTP ${res.status}` };
    return { reachable: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("github.ping.error", { message });
    return { reachable: false, error: message };
  }
}

export function repoRawUrl(repoPath: string): string {
  return rawUrl(repoPath);
}

export function repoConfig() {
  return config();
}
