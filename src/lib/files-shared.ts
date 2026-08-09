// ===========================================================================
// Client-safe file helpers — no server-only imports here.
// ===========================================================================

const EDITABLE_EXTENSIONS = new Set<string>([
  "txt",
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "cjs",
  "json",
  "xml",
  "php",
  "md",
  "markdown",
  "yaml",
  "yml",
  "ts",
  "tsx",
  "jsx",
  "csv",
  "log",
  "env",
  "ini",
  "conf",
  "sh",
  "py",
  "sql",
  "svg",
]);

const EXTENSION_TO_MONACO_LANGUAGE: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  xml: "xml",
  svg: "xml",
  php: "php",
  md: "markdown",
  markdown: "markdown",
  yaml: "yaml",
  yml: "yaml",
  py: "python",
  sh: "shell",
  bash: "shell",
  sql: "sql",
  csv: "plaintext",
  txt: "plaintext",
  log: "plaintext",
  env: "ini",
  ini: "ini",
  conf: "ini",
};

export function isEditableFile(ext: string): boolean {
  return EDITABLE_EXTENSIONS.has(ext.toLowerCase());
}

export function monacoLanguageFor(ext: string): string {
  return EXTENSION_TO_MONACO_LANGUAGE[ext.toLowerCase()] || "plaintext";
}

export function buildFileUrl(relativePath: string): string {
  const clean = relativePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `/uploads/${clean}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
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

export function fileKindLabel(file: {
  isDirectory: boolean;
  extension: string;
  mimeType: string;
}): string {
  if (file.isDirectory) return "Folder";
  const ext = file.extension.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg"].includes(ext))
    return "Image";
  if (["pdf"].includes(ext)) return "PDF";
  if (["doc", "docx", "txt", "md", "rtf", "csv"].includes(ext)) return "Document";
  if (["xls", "xlsx", "ppt", "pptx"].includes(ext)) return "Office";
  if (["zip", "gz", "tar", "7z", "rar"].includes(ext)) return "Archive";
  if (["mp3", "wav", "ogg"].includes(ext)) return "Audio";
  if (["mp4", "webm", "mov"].includes(ext)) return "Video";
  if (EDITABLE_EXTENSIONS.has(ext)) return "Code";
  return file.mimeType || "File";
}
