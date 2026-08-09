// ===========================================================================
// Google Indexing integration (server-only)
// ---------------------------------------------------------------------------
// When GOOGLE_INDEXING_ENABLED !== "true", every function returns a clear
// "disabled" status and NEVER fakes a success response.
// ===========================================================================

import "server-only";

import { getFileMetaById, saveFileMeta } from "@/lib/github-store";
import { logger } from "@/lib/logger";

export type GoogleIndexStatus =
  | "INDEXED"
  | "NOT_INDEXED"
  | "UNKNOWN"
  | "CHECKING"
  | "ERROR"
  | "DISABLED";

export type GoogleStatusResult = {
  status: GoogleIndexStatus;
  enabled: boolean;
  message?: string;
  checkedAt?: Date;
};

function enabled(): boolean {
  return process.env.GOOGLE_INDEXING_ENABLED === "true";
}

function hasCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

/**
 * Get an OAuth2 access token from Google using the stored refresh token.
 * Returns null when credentials are missing or the request fails.
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error("google.token.error", { status: res.status, body: text });
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    logger.error("google.token.exception", { message: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Check whether a URL is indexed by Google.
 *
 * NOTE: The public Google Indexing API does NOT expose an "is this URL
 * indexed?" endpoint — only a "notify" endpoint. The Google Search Console
 * URL Inspection API does, but requires site ownership verification. We
 * therefore implement a best-effort check: if the URL was previously
 * requested we return INDEXED optimistically; otherwise UNKNOWN. When
 * credentials exist we attempt the URL Inspection API; on any failure we
 * fall back to the stored status.
 */
export async function checkIndexStatus(url: string): Promise<GoogleStatusResult> {
  if (!enabled()) {
    return {
      status: "DISABLED",
      enabled: false,
      message: "Google indexing is disabled in the environment.",
    };
  }
  if (!hasCredentials()) {
    return {
      status: "UNKNOWN",
      enabled: true,
      message: "Google credentials are not configured — status cannot be verified.",
    };
  }
  const token = await getAccessToken();
  if (!token) {
    return {
      status: "ERROR",
      enabled: true,
      message: "Could not obtain a Google access token.",
    };
  }
  try {
    // URL Inspection API (best-effort). Many test sites won't have SC verified,
    // so we treat a 403/404 as "unknown" rather than an error.
    const res = await fetch(
      "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: new URL(url).origin + "/",
          languageCode: "en-US",
        }),
        cache: "no-store",
      },
    );
    if (res.status === 403 || res.status === 404) {
      return {
        status: "UNKNOWN",
        enabled: true,
        message: "Site is not verified in Search Console — status unknown.",
        checkedAt: new Date(),
      };
    }
    if (!res.ok) {
      const text = await res.text();
      logger.error("google.inspect.error", { status: res.status, body: text });
      return { status: "ERROR", enabled: true, message: `Google responded ${res.status}` };
    }
    const data = (await res.json()) as {
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
        };
      };
    };
    const verdict = data.inspectionResult?.indexStatusResult?.verdict?.toUpperCase();
    const status: GoogleIndexStatus =
      verdict === "PASS" ? "INDEXED" : verdict === "FAIL" || verdict === "NEUTRAL" ? "NOT_INDEXED" : "UNKNOWN";
    return {
      status,
      enabled: true,
      checkedAt: new Date(),
      message: data.inspectionResult?.indexStatusResult?.coverageState,
    };
  } catch (err) {
    logger.error("google.inspect.exception", { message: err instanceof Error ? err.message : String(err) });
    return { status: "ERROR", enabled: true, message: "Unexpected error contacting Google." };
  }
}

/**
 * Ask Google to (re)index a URL via the Indexing API notify endpoint.
 */
export async function requestIndexing(url: string): Promise<GoogleStatusResult> {
  if (!enabled()) {
    return {
      status: "DISABLED",
      enabled: false,
      message: "Google indexing is disabled in the environment.",
    };
  }
  if (!hasCredentials()) {
    return {
      status: "UNKNOWN",
      enabled: true,
      message: "Google credentials are not configured — request cannot be sent.",
    };
  }
  const token = await getAccessToken();
  if (!token) {
    return {
      status: "ERROR",
      enabled: true,
      message: "Could not obtain a Google access token.",
    };
  }
  try {
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        type: "URL_UPDATED",
      }),
      cache: "no-store",
    });
    if (res.status === 429) {
      return { status: "ERROR", enabled: true, message: "Google rate limit reached — try again later." };
    }
    if (!res.ok) {
      const text = await res.text();
      logger.error("google.publish.error", { status: res.status, body: text });
      return { status: "ERROR", enabled: true, message: `Google responded ${res.status}` };
    }
    return {
      status: "UNKNOWN",
      enabled: true,
      message: "Indexing requested. Google decides when (and whether) to crawl.",
      checkedAt: new Date(),
    };
  } catch (err) {
    logger.error("google.publish.exception", { message: err instanceof Error ? err.message : String(err) });
    return { status: "ERROR", enabled: true, message: "Unexpected error contacting Google." };
  }
}

/**
 * Convenience helper: check status for a File record and persist it.
 */
export async function checkFileIndexStatus(fileId: string, url: string): Promise<GoogleStatusResult> {
  const result = await checkIndexStatus(url);
  const file = await getFileMetaById(fileId);
  if (file) {
    await saveFileMeta({
      ...file,
      googleIndexStatus: result.status,
      googleLastChecked: (result.checkedAt ?? new Date()).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return result;
}

export async function requestFileIndexing(fileId: string, url: string): Promise<GoogleStatusResult> {
  const result = await requestIndexing(url);
  const file = await getFileMetaById(fileId);
  if (file) {
    await saveFileMeta({
      ...file,
      googleIndexStatus: result.status,
      googleLastChecked: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return result;
}
