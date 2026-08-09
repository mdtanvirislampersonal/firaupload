// Shared client-side types

export type FileRecord = {
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
};

export type FileListResponse = {
  files: FileRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type StatsResponse = {
  totalFiles: number;
  indexedFiles: number;
  noIndexFiles: number;
  googleIndexed: number;
  googleNotIndexed: number;
  githubSynced: number;
  folders: number;
  totalStorageBytes: number;
};

export type GithubStatus = {
  enabled: boolean;
  configured: boolean;
  owner: string;
  repo: string;
  branch: string;
  reachable?: boolean;
  error?: string;
};

export type LogRecord = {
  id: string;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { username: string } | null;
};

export type ListFilesInput = {
  folder?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "name" | "size" | "createdAt" | "updatedAt" | "type" | "extension" | "indexStatus";
  order?: "asc" | "desc";
  filter?:
    | "all"
    | "indexed"
    | "no-index"
    | "images"
    | "documents"
    | "code"
    | "archives"
    | "google-indexed"
    | "google-not-indexed"
    | "github-synced";
  view?: "list" | "grid";
};

export function buildFileUrl(relativePath: string): string {
  const clean = relativePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `/uploads/${clean}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
