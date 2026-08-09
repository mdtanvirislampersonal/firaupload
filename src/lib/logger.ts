// ===========================================================================
// Server-side logger
// ---------------------------------------------------------------------------
// Thin wrapper around console with levels + redaction. NEVER log secrets,
// passwords, tokens, or full request bodies.
// ===========================================================================

import "server-only";

const REDACT_KEYS = [
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "secret",
  "github_token",
  "authtoken",
  "apikey",
  "api_key",
];

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth-limit]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.includes(k.toLowerCase())) {
      out[k] = "[redacted]";
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

function fmt(level: string, message: string, meta?: unknown) {
  const ts = new Date().toISOString();
  const metaStr = meta !== undefined ? " " + JSON.stringify(redact(meta)) : "";
  return `${ts} [${level}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(fmt("INFO", message, meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(fmt("WARN", message, meta));
  },
  error(message: string, meta?: unknown) {
    console.error(fmt("ERROR", message, meta));
  },
  debug(message: string, meta?: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(fmt("DEBUG", message, meta));
    }
  },
};
