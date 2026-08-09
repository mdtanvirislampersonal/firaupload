// ===========================================================================
// Server-side security helpers
// ---------------------------------------------------------------------------
// All functions here MUST run on the server only. They handle password
// hashing, path sanitization, MIME validation and session helpers.
// Never import this module from a client component.
//
// NOTE: This module no longer touches the local filesystem — all persistence
// goes through the GitHub store. Only pure helpers remain.
// ===========================================================================

import "server-only";

import bcrypt from "bcryptjs";
import path from "node:path";
import {
  ALLOWED_MIME,
  DANGEROUS_EXECUTABLE_EXTENSIONS,
  EDITABLE_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Filename / path sanitization
// ---------------------------------------------------------------------------

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFilename(name: string): string {
  if (typeof name !== "string" || name.length === 0) return "untitled";
  // Take only the basename — never allow directory separators through.
  const base = name.split(/[/\\]/).pop() || name;
  let cleaned = base.replace(INVALID_FILENAME_CHARS, "_").trim();
  // Collapse consecutive underscores / dots
  cleaned = cleaned.replace(/^\.+/, "").replace(/_{2,}/g, "_");
  if (cleaned.length === 0) cleaned = "untitled";
  if (cleaned.length > 180) {
    const ext = path.extname(cleaned);
    cleaned =
      cleaned.slice(0, 180 - ext.length).trimEnd() + ext.toLowerCase();
  }
  if (RESERVED_WINDOWS_NAMES.test(path.basename(cleaned, path.extname(cleaned)))) {
    cleaned = "_" + cleaned;
  }
  // Never allow a sanitized name to start with ".file-manager" — that's our
  // internal metadata namespace.
  if (cleaned.toLowerCase() === ".file-manager" || cleaned.toLowerCase().startsWith(".file-manager/")) {
    cleaned = "_" + cleaned;
  }
  return cleaned;
}

/**
 * Sanitize a full relative path (e.g. "docs/2026/report.pdf"). Each segment
 * is sanitized, empty segments dropped, parent (..) segments rejected.
 */
export function sanitizeRelativePath(input: string): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().replace(/^[/\\]+/, "").replace(/[/\\]+$/, "");
  if (!trimmed) return "";
  const segments = trimmed.split(/[/\\]+/).filter(Boolean);
  const clean: string[] = [];
  for (const seg of segments) {
    if (seg === ".." || seg === ".") continue;
    const s = sanitizeFilename(seg);
    if (s) clean.push(s);
  }
  // Reject paths that try to enter the private metadata namespace.
  if (clean[0]?.toLowerCase() === ".file-manager") return "";
  return clean.join("/");
}

export function getExtension(name: string): string {
  const ext = path.extname(name).toLowerCase().replace(/^\./, "");
  return ext;
}

export function isExtensionDangerous(ext: string): boolean {
  return DANGEROUS_EXECUTABLE_EXTENSIONS.has(ext.toLowerCase());
}

export function isExtensionEditable(ext: string): boolean {
  const set = new Set<string>(EDITABLE_EXTENSIONS);
  return set.has(ext.toLowerCase());
}

// ---------------------------------------------------------------------------
// MIME validation
// ---------------------------------------------------------------------------

export function isAllowedMime(mime: string): boolean {
  if (!mime) return false;
  const lower = mime.toLowerCase().split(";")[0].trim();
  return ALLOWED_MIME.has(lower);
}

export function isWithinUploadSize(sizeBytes: number): boolean {
  return Number.isFinite(sizeBytes) && sizeBytes > 0 && sizeBytes <= MAX_UPLOAD_SIZE_BYTES;
}

// ---------------------------------------------------------------------------
// Session helpers (used by API routes)
// ---------------------------------------------------------------------------

export async function getServerSessionUser(): Promise<{
  id: string;
  username: string;
  role: string;
} | null> {
  // Lazy import so this file stays decoupled from next-auth at module load.
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u || !u.id) return null;
  return {
    id: u.id as string,
    username: (u.username as string) || (u.name as string) || "unknown",
    role: (u.role as string) || "ADMIN",
  };
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") || headers.get("x-client-ip") || null;
}

// ---------------------------------------------------------------------------
// Standard API response helpers
// ---------------------------------------------------------------------------

export function ok<T>(data?: T, message?: string) {
  return Response.json(
    { success: true, message, data },
    { status: 200 },
  );
}

export function created<T>(data?: T, message?: string) {
  return Response.json(
    { success: true, message, data },
    { status: 201 },
  );
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json(
    { success: false, message, ...extra },
    { status },
  );
}
