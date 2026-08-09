// ===========================================================================
// GET /api/files — list/search/filter/sort/paginate files
// ---------------------------------------------------------------------------
// Files are listed from the GitHub repo tree (single Git Trees API call).
// Metadata (isIndexed, google status, sha, ...) is merged in from
// `.file-manager/metadata.json`. Folders are inferred from the tree paths
// so we don't need a separate "directory" record per folder.
// ===========================================================================

import { NextRequest } from "next/server";
import { ok, fail, getServerSessionUser, sanitizeRelativePath } from "@/lib/security";
import { listFilesSchema } from "@/lib/validation";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import {
  getRepoTree,
  getAllFileMeta,
  invalidateTree,
  type FileMeta,
  type RepoEntry,
} from "@/lib/github-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg"]);
const DOCUMENT_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "rtf"]);
const CODE_EXT = new Set(["js", "ts", "tsx", "jsx", "css", "html", "htm", "json", "xml", "php", "py", "sh", "sql", "yaml", "yml", "env", "ini", "conf", "mjs", "cjs"]);
const ARCHIVE_EXT = new Set(["zip", "gz", "tar", "7z", "rar", "bz2"]);

const HIDDEN_PREFIXES = [".file-manager/"];

function isHidden(path: string): boolean {
  return HIDDEN_PREFIXES.some((p) => path === p.slice(0, -1) || path.startsWith(p));
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

function nameOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}

function parentOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(0, i) : "";
}

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
    cjs: "text/javascript",
    json: "application/json",
    xml: "application/xml",
    svg: "image/svg+xml",
    md: "text/markdown",
    csv: "text/csv",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    zip: "application/zip",
    gz: "application/gzip",
    php: "application/x-php",
    sh: "application/x-sh",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

interface ListedEntry {
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
  githubSynced: boolean;
  githubSha: string | null;
  createdAt: string;
  updatedAt: string;
}

function buildListedEntries(
  tree: RepoEntry[],
  meta: Record<string, FileMeta>,
  folder: string,
): ListedEntry[] {
  const seen = new Set<string>();
  const out: ListedEntry[] = [];
  const folderPrefix = folder ? folder + "/" : "";

  for (const entry of tree) {
    if (isHidden(entry.path)) continue;
    // Skip the .gitkeep markers — they're only there to keep dirs in git.
    if (entry.name === ".gitkeep") continue;
    // For non-folder browsing, only consider direct children of root.
    if (folder) {
      if (!entry.path.startsWith(folderPrefix)) continue;
      const rest = entry.path.slice(folderPrefix.length);
      if (rest.includes("/")) {
        // It's a deeper descendant. Surface the immediate child folder.
        const childName = rest.slice(0, rest.indexOf("/"));
        const childPath = folderPrefix + childName;
        if (seen.has(childPath)) continue;
        seen.add(childPath);
        const m = meta[childPath];
        const now = new Date().toISOString();
        out.push({
          id: m?.id ?? childPath,
          name: childName,
          relativePath: childPath,
          mimeType: "inode/directory",
          extension: "",
          size: 0,
          isDirectory: true,
          isIndexed: m?.isIndexed ?? false,
          googleIndexStatus: m?.googleIndexStatus ?? "UNKNOWN",
          googleLastChecked: m?.googleLastChecked ?? null,
          githubSynced: true,
          githubSha: null,
          createdAt: m?.createdAt ?? now,
          updatedAt: m?.updatedAt ?? now,
        });
      } else {
        // Direct child file
        const m = meta[entry.path];
        const now = new Date().toISOString();
        out.push({
          id: m?.id ?? entry.path,
          name: entry.name,
          relativePath: entry.path,
          mimeType: m?.mimeType ?? guessMime(entry.extension),
          extension: extOf(entry.name),
          size: entry.size,
          isDirectory: false,
          isIndexed: m?.isIndexed ?? false,
          googleIndexStatus: m?.googleIndexStatus ?? "UNKNOWN",
          googleLastChecked: m?.googleLastChecked ?? null,
          githubSynced: true,
          githubSha: entry.sha,
          createdAt: m?.createdAt ?? now,
          updatedAt: m?.updatedAt ?? now,
        });
      }
    } else {
      // Root browsing
      if (entry.path.includes("/")) {
        const childName = entry.path.slice(0, entry.path.indexOf("/"));
        if (seen.has(childName)) continue;
        seen.add(childName);
        const childPath = childName;
        const m = meta[childPath];
        const now = new Date().toISOString();
        out.push({
          id: m?.id ?? childPath,
          name: childName,
          relativePath: childPath,
          mimeType: "inode/directory",
          extension: "",
          size: 0,
          isDirectory: true,
          isIndexed: m?.isIndexed ?? false,
          googleIndexStatus: m?.googleIndexStatus ?? "UNKNOWN",
          googleLastChecked: m?.googleLastChecked ?? null,
          githubSynced: true,
          githubSha: null,
          createdAt: m?.createdAt ?? now,
          updatedAt: m?.updatedAt ?? now,
        });
      } else {
        const m = meta[entry.path];
        const now = new Date().toISOString();
        out.push({
          id: m?.id ?? entry.path,
          name: entry.name,
          relativePath: entry.path,
          mimeType: m?.mimeType ?? guessMime(extOf(entry.name)),
          extension: extOf(entry.name),
          size: entry.size,
          isDirectory: false,
          isIndexed: m?.isIndexed ?? false,
          googleIndexStatus: m?.googleIndexStatus ?? "UNKNOWN",
          googleLastChecked: m?.googleLastChecked ?? null,
          githubSynced: true,
          githubSha: entry.sha,
          createdAt: m?.createdAt ?? now,
          updatedAt: m?.updatedAt ?? now,
        });
      }
    }
  }
  return out;
}

function applyFilter(
  entries: ListedEntry[],
  filter: string,
  search?: string,
): ListedEntry[] {
  let out = entries;
  switch (filter) {
    case "indexed":
      out = out.filter((e) => !e.isDirectory && e.isIndexed);
      break;
    case "no-index":
      out = out.filter((e) => !e.isDirectory && !e.isIndexed);
      break;
    case "images":
      out = out.filter((e) => !e.isDirectory && IMAGE_EXT.has(e.extension));
      break;
    case "documents":
      out = out.filter((e) => !e.isDirectory && DOCUMENT_EXT.has(e.extension));
      break;
    case "code":
      out = out.filter((e) => !e.isDirectory && CODE_EXT.has(e.extension));
      break;
    case "archives":
      out = out.filter((e) => !e.isDirectory && ARCHIVE_EXT.has(e.extension));
      break;
    case "google-indexed":
      out = out.filter((e) => !e.isDirectory && e.googleIndexStatus === "INDEXED");
      break;
    case "google-not-indexed":
      out = out.filter((e) => !e.isDirectory && e.googleIndexStatus !== "INDEXED");
      break;
    case "github-synced":
      out = out.filter((e) => !e.isDirectory && e.githubSynced);
      break;
    case "all":
    default:
      break;
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.relativePath.toLowerCase().includes(q),
    );
  }
  return out;
}

function sortEntries(entries: ListedEntry[], sort: string, order: string): ListedEntry[] {
  const dir = order === "desc" ? -1 : 1;
  const sorted = [...entries].sort((a, b) => {
    // Always show directories first
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    let cmp = 0;
    switch (sort) {
      case "size":
        cmp = a.size - b.size;
        break;
      case "createdAt":
        cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
        break;
      case "updatedAt":
        cmp = a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0;
        break;
      case "extension":
        cmp = a.extension.localeCompare(b.extension);
        break;
      case "type":
        cmp = a.mimeType.localeCompare(b.mimeType);
        break;
      case "indexStatus":
        cmp = (a.isIndexed ? 1 : 0) - (b.isIndexed ? 1 : 0);
        break;
      case "name":
      default:
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        break;
    }
    if (cmp === 0) {
      cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
    return cmp * dir;
  });
  return sorted;
}

export async function GET(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = listFilesSchema.safeParse(params);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Invalid query", 422);
  }
  const input = parsed.data;

  try {
    const [tree, meta] = await Promise.all([getRepoTree(), getAllFileMeta()]);
    const folder = sanitizeRelativePath(input.folder);
    const all = buildListedEntries(tree, meta, folder);
    const filtered = applyFilter(all, input.filter, input.search);
    const sorted = sortEntries(filtered, input.sort, input.order);

    const page = input.page;
    const pageSize = input.pageSize || DEFAULT_PAGE_SIZE;
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);

    return ok({
      files: pageItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("files.list.error", { message });
    return fail("Could not list files: " + message, 500);
  }
}

// Allow clients to force-refresh the tree cache after mutations.
export async function DELETE() {
  invalidateTree();
  return ok({ invalidated: true });
}
