module.exports = [
"[project]/node_modules/next-auth/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/node_modules_0e0a866e._.js",
  "server/chunks/[externals]__10aa7b11._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
    });
});
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/_964831c4._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/auth.ts [app-route] (ecmascript)");
    });
});
}),
];