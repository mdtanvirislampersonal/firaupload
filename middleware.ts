// ===========================================================================
// Middleware — protect dashboard + protected API routes
// ---------------------------------------------------------------------------
// Runs on the Edge Runtime. Uses next-auth/jwt getToken to check the session.
// Wrapped in try/catch so that any unexpected error (missing AUTH_SECRET,
// crypto issue, etc.) degrades gracefully — it treats the request as
// unauthenticated and redirects/401s instead of crashing with a 500.
// ===========================================================================

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/setup",
  "/api/auth",
  "/api/setup",
  "/uploads",
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
  "/logo.svg",
  "/_next",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protected route prefixes
  const protectedPrefixes = [
    "/dashboard",
    "/api/files",
    "/api/indexing",
    "/api/github",
    "/api/google",
  ];
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Try to read the NextAuth JWT token. If anything goes wrong (missing
  // secret, crypto error on edge, malformed cookie, ...) treat as
  // unauthenticated rather than crashing with a 500.
  let isAuthenticated = false;
  try {
    const { getToken } = await import("next-auth/jwt");
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
    isAuthenticated = Boolean(token);
  } catch (err) {
    // Log to console (Vercel will show it) but don't crash.
    console.error("[middleware] getToken failed:", err);
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    // API requests get 401 JSON; page requests redirect to /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets and Next internals
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt|sitemap.xml|uploads).*)",
  ],
};
