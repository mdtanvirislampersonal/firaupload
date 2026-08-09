// ===========================================================================
// Base URL resolution (server + client)
// ---------------------------------------------------------------------------
// getBaseUrl reads the incoming request headers (x-forwarded-proto +
// x-forwarded-host, falling back to host) and validates against the optional
// TRUSTED_HOSTS env var. Never hard-codes a domain.
// ===========================================================================

const FALLBACK = "http://localhost:3000";

function readTrustedHosts(): string[] {
  const raw = process.env.TRUSTED_HOSTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function isValidHost(host: string, trusted: string[]): boolean {
  if (trusted.length === 0) return true; // not configured = trust incoming
  const h = host.toLowerCase();
  // Allow exact + subdomain matches
  return trusted.some((t) => h === t || h.endsWith("." + t));
}

/**
 * Resolve the base URL of the current request from headers.
 * Returns a string like "https://example.com" (no trailing slash).
 */
export function getBaseUrl(headers?: Headers): string {
  const h = headers ?? new Headers();
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const hostRaw =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    h.get("host") ||
    "";
  const trusted = readTrustedHosts();
  if (!hostRaw || !isValidHost(hostRaw, trusted)) {
    return FALLBACK;
  }
  return `${proto}://${hostRaw}`;
}

/**
 * Client-side helper — uses window.location.origin.
 */
export function getClientBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return FALLBACK;
}
