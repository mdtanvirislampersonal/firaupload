// ===========================================================================
// POST /api/setup — create the first admin (only when zero admins exist)
// ---------------------------------------------------------------------------
// Users are stored in `.file-manager/users.json` on GitHub. When no admin
// exists yet, anyone can create the first one. After that, this endpoint
// refuses to run.
// ===========================================================================

import { NextRequest } from "next/server";
import {
  hashPassword,
  ok,
  fail,
  sanitizeFilename,
} from "@/lib/security";
import { createUser, countAdmins, getUserByUsername, githubConfigured } from "@/lib/github-store";
import { setupSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ACTIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!githubConfigured()) {
      return fail(
        "GitHub is not configured. Set GITHUB_OWNER, GITHUB_REPOSITORY and GITHUB_TOKEN in your environment.",
        500,
      );
    }

    const adminCount = await countAdmins();
    if (adminCount > 0) {
      return fail(
        "Setup is already complete. An admin account exists.",
        403,
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message || "Invalid input",
        422,
      );
    }
    const { username, password } = parsed.data;
    const safeUsername = sanitizeFilename(username).toLowerCase();

    const existing = await getUserByUsername(safeUsername);
    if (existing) {
      return fail("Username already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = randomUUID();
    await createUser({
      id: userId,
      username: safeUsername,
      passwordHash,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    });

    await logActivity({
      userId,
      action: ACTIONS.CREATE_FILE, // closest semantic: first-admin setup
      target: safeUsername,
      details: "First admin account created via /setup",
      headers: req.headers,
    });

    logger.info("setup.admin.created", { username: safeUsername });

    return ok(
      { id: userId, username: safeUsername },
      "Admin account created. You can now log in.",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("setup.error", { message });
    return fail("Setup failed: " + message, 500);
  }
}

/**
 * GET /api/setup — returns whether setup is still available.
 */
export async function GET() {
  if (!githubConfigured()) {
    return ok({ setupAvailable: false, reason: "GitHub not configured" });
  }
  const adminCount = await countAdmins();
  return ok({ setupAvailable: adminCount === 0 });
}
