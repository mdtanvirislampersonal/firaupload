// ===========================================================================
// Middleware — protect dashboard + protected API routes (Edge-compatible)
// ---------------------------------------------------------------------------
// This middleware does NOT import next-auth/jwt (which crashes Vercel's
// Edge Runtime). It only checks whether the NextAuth session cookie
// EXISTS. The actual JWT verification happens server-side in:
//   - dashboard/layout.tsx  → getServerSession(authOptions)
//   - every API route        → getServerSessionUser()
// ===========================================================================

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const PUBLIC_PATHS = [
  "/login",
  "/setup",
  "/api/auth",
  "/api/setup",
  "/uploads",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Only run auth check on protected route prefixes
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

  // Check for session cookie existence
  if (!hasSessionCookie(req)) {
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
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.svg|robots.txt|sitemap.xml|uploads).*)",
  ],
};
