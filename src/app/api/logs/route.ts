// ===========================================================================
// GET /api/logs — paginated activity logs with optional action filter
// ---------------------------------------------------------------------------
// Reads `.file-manager/activity.jsonl` from GitHub.
// ===========================================================================

import { NextRequest } from "next/server";
import { ok, fail, getServerSessionUser } from "@/lib/security";
import { getAllActivity } from "@/lib/github-store";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(DEFAULT_PAGE_SIZE),
  action: z.string().optional(),
  search: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getServerSessionUser();
  if (!user) return fail("Authentication required", 401);

  const url = new URL(req.url);
  const parsed = schema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return fail("Invalid query", 422);
  const { page, pageSize, action, search } = parsed.data;

  const all = await getAllActivity();
  let filtered = all;
  if (action && action !== "all") {
    filtered = filtered.filter((e) => e.action === action);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        (e.target ?? "").toLowerCase().includes(q) ||
        (e.details ?? "").toLowerCase().includes(q) ||
        (e.username ?? "").toLowerCase().includes(q),
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize).map((e) => ({
    id: e.id,
    action: e.action,
    target: e.target,
    details: e.details,
    ipAddress: e.ipAddress,
    createdAt: e.createdAt,
    user: e.username ? { username: e.username } : null,
  }));

  return ok({
    logs: pageItems,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
