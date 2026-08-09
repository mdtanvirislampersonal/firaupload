// ===========================================================================
// Activity logging helper (server-only)
// ---------------------------------------------------------------------------
// Appends to `.file-manager/activity.jsonl` on GitHub. There is no local
// database. Failures are swallowed so logging never breaks a request.
// ===========================================================================

import "server-only";

import { appendActivity, getUserById, type ActivityEntry } from "@/lib/github-store";
import { getClientIp } from "@/lib/security";
import { ACTIONS, type ActivityAction } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export { ACTIONS };

export async function logActivity(params: {
  userId?: string | null;
  action: ActivityAction;
  target?: string | null;
  details?: string | null;
  headers?: Headers;
}): Promise<void> {
  const { userId, action, target, details, headers } = params;
  const ipAddress = headers ? getClientIp(headers) : null;
  try {
    let username: string | null = null;
    if (userId) {
      const u = await getUserById(userId).catch(() => null);
      username = u?.username ?? null;
    }
    const entry: ActivityEntry = {
      id: randomUUID(),
      userId: userId ?? null,
      username,
      action,
      target: target ?? null,
      details: details ?? null,
      ipAddress,
      createdAt: new Date().toISOString(),
    };
    await appendActivity(entry);
  } catch (err) {
    // never let logging break a request
    logger.error("activity.log.error", {
      action,
      target,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
