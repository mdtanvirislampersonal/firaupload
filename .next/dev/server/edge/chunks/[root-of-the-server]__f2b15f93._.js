(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f2b15f93._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
// NextAuth v4 cookie names:
//   - "next-auth.session-token"              (development / HTTP)
//   - "__Secure-next-auth.session-token"     (production / HTTPS)
const SESSION_COOKIE_NAMES = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token"
];
const PUBLIC_PATHS = [
    "/login",
    "/setup",
    "/api/auth",
    "/api/setup",
    "/uploads",
    "/sitemap.xml",
    "/robots.txt"
];
function isPublic(pathname) {
    return PUBLIC_PATHS.some((p)=>pathname === p || pathname.startsWith(p + "/"));
}
function hasSessionCookie(req) {
    return SESSION_COOKIE_NAMES.some((name)=>req.cookies.has(name));
}
function middleware(req) {
    const { pathname } = req.nextUrl;
    // 1. Always allow public paths
    if (isPublic(pathname)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 2. Only run auth check on protected route prefixes
    const protectedPrefixes = [
        "/dashboard",
        "/api/files",
        "/api/indexing",
        "/api/github",
        "/api/google"
    ];
    const isProtected = protectedPrefixes.some((p)=>pathname === p || pathname.startsWith(p + "/"));
    if (!isProtected) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 3. Check for session cookie existence (NO JWT verification here —
    //    that happens server-side via getServerSession in the route handler)
    if (!hasSessionCookie(req)) {
        // API requests get 401 JSON; page requests redirect to /login
        if (pathname.startsWith("/api/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                message: "Authentication required"
            }, {
                status: 401
            });
        }
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("callbackUrl", pathname);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    // Exclude static assets, Next internals, and public files from the
    // middleware so it doesn't run on favicon, images, sitemap, etc.
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.svg|robots.txt|sitemap.xml|uploads|public).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f2b15f93._.js.map