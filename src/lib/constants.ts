// ===========================================================================
// Application constants
// ===========================================================================

// File extensions that can be edited in the in-browser Monaco editor.
export const EDITABLE_EXTENSIONS = [
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
] as const;

export type EditableExtension = (typeof EDITABLE_EXTENSIONS)[number];

// Allowed MIME types for uploads. We keep this permissive enough for typical
// documents/assets but reject executable/script types that should never be
// uploaded (these are served as attachments only via the secure route).
export const ALLOWED_MIME = new Set<string>([
  // Text / documents
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "text/csv",
  "text/markdown",
  "text/xml",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-yaml",
  "application/yaml",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/x-icon",
  "image/avif",
  // PDF / office
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-tar",
  "application/x-7z-compressed",
  // Audio / video
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Code-ish
  "application/x-php",
  "application/x-sh",
  "application/x-httpd-php",
]);

// Extensions that should NEVER execute when served through /uploads/* — they
// are forced to download via Content-Disposition: attachment.
export const DANGEROUS_EXECUTABLE_EXTENSIONS = new Set<string>([
  "php",
  "phtml",
  "phar",
  "php3",
  "php4",
  "php5",
  "php7",
  "phps",
  "asp",
  "aspx",
  "jsp",
  "exe",
  "bat",
  "cmd",
  "sh",
  "bash",
  "pl",
  "py",
  "rb",
  "cgi",
]);

// NOTE: There is no local storage root. All files live in the GitHub repo.
// The /uploads/* route proxies to raw.githubusercontent.com at request time.

// Route prefix used to build public URLs to uploaded files.
export const UPLOADS_ROUTE_PREFIX = "/uploads";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;

// Max upload size (bytes). Read from env at module load.
export const MAX_UPLOAD_SIZE_BYTES =
  Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB || "100", 10) * 1024 * 1024;

// Activity log action constants
export const ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  UPLOAD: "UPLOAD",
  UPLOAD_MULTIPLE: "UPLOAD_MULTIPLE",
  CREATE_FILE: "CREATE_FILE",
  CREATE_FOLDER: "CREATE_FOLDER",
  EDIT: "EDIT",
  RENAME: "RENAME",
  MOVE: "MOVE",
  DELETE: "DELETE",
  INDEX_ENABLED: "INDEX_ENABLED",
  INDEX_DISABLED: "INDEX_DISABLED",
  GOOGLE_STATUS_CHECK: "GOOGLE_STATUS_CHECK",
  GOOGLE_INDEX_REQUEST: "GOOGLE_INDEX_REQUEST",
  GITHUB_SYNC: "GITHUB_SYNC",
  GITHUB_DELETE: "GITHUB_DELETE",
} as const;

export type ActivityAction =
  (typeof ACTIONS)[keyof typeof ACTIONS];

// Map file extensions -> Monaco language ids for the code editor.
export const EXTENSION_TO_MONACO_LANGUAGE: Record<string, string> = {
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
