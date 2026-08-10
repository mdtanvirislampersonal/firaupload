// ===========================================================================
// Middleware — protect dashboard + protected API routes (Edge-compatible)
// ---------------------------------------------------------------------------
// ROOT CAUSE OF PREVIOUS CRASH:
//   next-auth/jwt's getToken() pulls in `jose`, `@panva/hkdf`, and `uuid`.
//   On Vercel Edge Runtime the Node.js CJS build of `jose` (which uses
//   Node's `crypto` module) gets bundled and crashes with
//   MIDDLEWARE_INVOCATION_FAILED. The dynamic import() inside try/catch
//   does NOT help because the module bundle itself fails to load.
//
// FIX:
//   This middleware does NOT import next-auth/jwt. It only checks whether
//   the NextAuth session cookie EXISTS (no JWT verification). The actual
//   JWT verification happens server-side in:
//     - dashboard/layout.tsx  → getServerSession(authOptions)
//     - every API route        → getServerSessionUser()
//   So even if a user sets a fake cookie to bypass the middleware, they
//   still cannot access any protected data — all API routes verify the
//   real JWT signature.
//
//   This is the officially recommended NextAuth + Next.js middleware
//   pattern for Edge Runtime:
//   https://nextjs.org/docs/app/building-your-application/routing/middleware
// ===========================================================================

import { NextResponse, type NextRequest } from "next/server";

// NextAuth v4 cookie names:
//   - "next-auth.session-token"              (development / HTTP)
//   - "__Secure-next-auth.session-token"     (production / HTTPS)
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

  // 1. Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2. Only run auth check on protected route prefixes
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

  // 3. Check for session cookie existence (NO JWT verification here —
  //    that happens server-side via getServerSession in the route handler)
  if (!hasSessionCookie(req)) {
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
  // Exclude static assets, Next internals, and public files from the
  // middleware so it doesn't run on favicon, images, sitemap, etc.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.svg|robots.txt|sitemap.xml|uploads|public).*)",
  ],
};

// Explicitly declare the Edge Runtime (default for middleware, but being
// explicit avoids any ambiguity that could trip up Vercel's bundler).
export const runtime = "edge";
