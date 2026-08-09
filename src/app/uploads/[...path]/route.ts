// ===========================================================================
// GET /uploads/[...path] — proxy a file from raw.githubusercontent.com
// ---------------------------------------------------------------------------
// Files live on GitHub. This route fetches them from
//   https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
// and streams them back to the browser with the correct Content-Type and
// Content-Disposition. Dangerous executable extensions (php, phtml, phar,
// exe, bat, sh, ...) are forced to download as application/octet-stream so
// they NEVER execute. Path traversal is prevented by sanitizing the path
// and rejecting any segment that tries to escape.
// ===========================================================================

import { NextRequest, NextResponse } from "next/server";
import { getExtension } from "@/lib/security";
import { repoRawUrl, repoConfig, githubConfigured } from "@/lib/github-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authedRawHeaders(): Record<string, string> {
  const c = repoConfig();
  const h: Record<string, string> = {
    "User-Agent": "file-manager-nextjs",
  };
  if (c.token) {
    h.Authorization = `Bearer ${c.token}`;
  }
  return h;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  cjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  yaml: "application/yaml; charset=utf-8",
  yml: "application/yaml; charset=utf-8",
  env: "text/plain; charset=utf-8",
  ini: "text/plain; charset=utf-8",
  conf: "text/plain; charset=utf-8",
  log: "text/plain; charset=utf-8",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  zip: "application/zip",
  gz: "application/gzip",
  tar: "application/x-tar",
  "7z": "application/x-7z-compressed",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "video/webm",
  mp4: "video/mp4",
};

// Extensions that must be downloaded rather than rendered/executed in the
// browser when accessed via /uploads/*. Combined with nosniff this is safe.
const FORCE_DOWNLOAD_EXTENSIONS = new Set<string>([
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
  // scripts the browser would otherwise execute
  "js",
  "mjs",
  "cjs",
  "html",
  "htm",
  "svg",
]);

// Extensions that should be served with application/octet-stream (never
// rendered, never sniffed into something executable).
const OCTET_STREAM_EXTENSIONS = new Set<string>([
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

function mimeFor(filename: string): string {
  const ext = getExtension(filename);
  if (OCTET_STREAM_EXTENSIONS.has(ext)) return "application/octet-stream";
  return MIME_BY_EXTENSION[ext] || "application/octet-stream";
}

function shouldForceDownload(filename: string): boolean {
  const ext = getExtension(filename);
  return FORCE_DOWNLOAD_EXTENSIONS.has(ext);
}

function isPathSafe(segments: string[]): boolean {
  // Reject path traversal and access to the private metadata namespace.
  for (const seg of segments) {
    if (seg === ".." || seg === "." || seg === "") return false;
    if (seg.toLowerCase() === ".file-manager") return false;
  }
  return true;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  if (!githubConfigured()) {
    return new NextResponse("File storage is not configured", { status: 503 });
  }

  const { path: segments } = await ctx.params;
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const decoded = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  if (!isPathSafe(decoded)) {
    logger.warn("uploads.traversal", { path: decoded.join("/") });
    return new NextResponse("Not found", { status: 404 });
  }

  const relativePath = decoded.join("/");
  const filename = decoded[decoded.length - 1];
  const url = new URL(req.url);
  const wantsDownload = url.searchParams.get("download") === "1";
  const forceDownload = shouldForceDownload(filename);

  const contentType = mimeFor(filename);
  const safeName = filename.replace(/["\\]/g, "_");
  const disposition =
    wantsDownload || forceDownload
      ? `attachment; filename="${safeName}"`
      : `inline; filename="${safeName}"`;

  const rawUrl = repoRawUrl(relativePath);
  const c = repoConfig();

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, {
      cache: "no-store",
      headers: authedRawHeaders(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("uploads.fetch.error", { path: relativePath, message });
    return new NextResponse("Could not fetch file", { status: 502 });
  }

  if (upstream.status === 404) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!upstream.ok) {
    logger.error("uploads.upstream.error", {
      path: relativePath,
      status: upstream.status,
    });
    return new NextResponse("Could not fetch file", { status: 502 });
  }

  const body = await upstream.arrayBuffer();
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": disposition,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=60, must-revalidate",
  };
  if (upstream.headers.get("content-length")) {
    headers["Content-Length"] = upstream.headers.get("content-length") as string;
  }

  // Hint at the source for debugging.
  headers["X-Source"] = `github:${c.owner}/${c.repo}/${c.branch}`;

  return new NextResponse(body, { status: 200, headers });
}

export async function HEAD(
  _req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await ctx.params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }
  if (!githubConfigured()) {
    return new NextResponse(null, { status: 503 });
  }
  const decoded = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  if (!isPathSafe(decoded)) {
    return new NextResponse(null, { status: 404 });
  }
  const relativePath = decoded.join("/");
  const filename = decoded[decoded.length - 1];
  const contentType = mimeFor(filename);
  const disposition = shouldForceDownload(filename)
    ? `attachment; filename="${filename}"`
    : `inline; filename="${filename}"`;
  try {
    const upstream = await fetch(repoRawUrl(relativePath), {
      method: "HEAD",
      cache: "no-store",
      headers: authedRawHeaders(),
    });
    if (upstream.status === 404) {
      return new NextResponse(null, { status: 404 });
    }
    if (!upstream.ok) {
      return new NextResponse(null, { status: 502 });
    }
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=60, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
