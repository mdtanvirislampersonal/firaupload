module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/lib/logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logger",
    ()=>logger
]);
// ===========================================================================
// Server-side logger
// ---------------------------------------------------------------------------
// Thin wrapper around console with levels + redaction. NEVER log secrets,
// passwords, tokens, or full request bodies.
// ===========================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
;
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
    "api_key"
];
function redact(value, depth = 0) {
    if (depth > 4) return "[depth-limit]";
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
        return value.slice(0, 50).map((v)=>redact(v, depth + 1));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)){
        if (REDACT_KEYS.includes(k.toLowerCase())) {
            out[k] = "[redacted]";
        } else {
            out[k] = redact(v, depth + 1);
        }
    }
    return out;
}
function fmt(level, message, meta) {
    const ts = new Date().toISOString();
    const metaStr = meta !== undefined ? " " + JSON.stringify(redact(meta)) : "";
    return `${ts} [${level}] ${message}${metaStr}`;
}
const logger = {
    info (message, meta) {
        console.log(fmt("INFO", message, meta));
    },
    warn (message, meta) {
        console.warn(fmt("WARN", message, meta));
    },
    error (message, meta) {
        console.error(fmt("ERROR", message, meta));
    },
    debug (message, meta) {
        if ("TURBOPACK compile-time truthy", 1) {
            console.debug(fmt("DEBUG", message, meta));
        }
    }
};
}),
"[project]/src/lib/github-store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addVersion",
    ()=>addVersion,
    "appendActivity",
    ()=>appendActivity,
    "countAdmins",
    ()=>countAdmins,
    "createDirectory",
    ()=>createDirectory,
    "createUser",
    ()=>createUser,
    "deleteFileContent",
    ()=>deleteFileContent,
    "deleteFileMeta",
    ()=>deleteFileMeta,
    "deleteFileMetaByPrefix",
    ()=>deleteFileMetaByPrefix,
    "deleteVersionsForFile",
    ()=>deleteVersionsForFile,
    "getAllActivity",
    ()=>getAllActivity,
    "getAllFileMeta",
    ()=>getAllFileMeta,
    "getAllUsers",
    ()=>getAllUsers,
    "getFileBytes",
    ()=>getFileBytes,
    "getFileMeta",
    ()=>getFileMeta,
    "getFileMetaById",
    ()=>getFileMetaById,
    "getFileText",
    ()=>getFileText,
    "getRepoTree",
    ()=>getRepoTree,
    "getUserById",
    ()=>getUserById,
    "getUserByUsername",
    ()=>getUserByUsername,
    "getVersionsForFile",
    ()=>getVersionsForFile,
    "githubConfigured",
    ()=>githubConfigured,
    "githubEnabled",
    ()=>githubEnabled,
    "invalidateTree",
    ()=>invalidateTree,
    "listRepoEntries",
    ()=>listRepoEntries,
    "pingGithub",
    ()=>pingGithub,
    "repoConfig",
    ()=>repoConfig,
    "repoPathExists",
    ()=>repoPathExists,
    "repoRawUrl",
    ()=>repoRawUrl,
    "reprefixFileMeta",
    ()=>reprefixFileMeta,
    "saveFileMeta",
    ()=>saveFileMeta,
    "saveManyFileMeta",
    ()=>saveManyFileMeta,
    "uploadFileContent",
    ()=>uploadFileContent,
    "uploadFileText",
    ()=>uploadFileText
]);
// ===========================================================================
// GitHub Store — generic JSON-backed key-value store on GitHub
// ---------------------------------------------------------------------------
// This module implements a tiny "database" on top of a GitHub repository.
// State lives in JSON / JSONL files under the `.file-manager/` directory in
// the configured repository. There is NO local database — GitHub is the
// single source of truth.
//
// Layout on GitHub:
//   .file-manager/
//     metadata.json     # File metadata (indexing flags, google status, sha, ...)
//     users.json        # Admin users (bcrypt-hashed passwords)
//     activity.jsonl    # Append-only activity log (one JSON object per line)
//     versions.json     # File version snapshots (keyed by fileId)
//
// All writes go through the GitHub Contents API (PUT with base64 content).
// All reads use raw.githubusercontent.com (fast, CDN-backed, no API quota).
// Metadata is cached in-memory for a short TTL to avoid hammering GitHub.
// ===========================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/logger.ts [app-route] (ecmascript)");
;
;
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GITHUB_API = "https://api.github.com";
const RAW_BASE = "https://raw.githubusercontent.com";
const META_DIR = ".file-manager";
const METADATA_FILE = `${META_DIR}/metadata.json`;
const USERS_FILE = `${META_DIR}/users.json`;
const ACTIVITY_FILE = `${META_DIR}/activity.jsonl`;
const VERSIONS_FILE = `${META_DIR}/versions.json`;
const CACHE_TTL_MS = 5_000; // 5 seconds — short so writes are visible quickly
function config() {
    return {
        owner: process.env.GITHUB_OWNER || "",
        repo: process.env.GITHUB_REPOSITORY || "",
        branch: process.env.GITHUB_BRANCH || "main",
        token: process.env.GITHUB_TOKEN || ""
    };
}
function githubEnabled() {
    return process.env.GITHUB_ENABLED === "true";
}
function githubConfigured() {
    const c = config();
    return Boolean(c.owner && c.repo && c.token);
}
function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "file-manager-nextjs"
    };
}
function encodePath(p) {
    const clean = p.replace(/^\/+/, "");
    return clean.split("/").map((seg)=>encodeURIComponent(seg)).join("/");
}
function rawUrl(path) {
    const c = config();
    // Add a cache-buster so we always get the freshest content from
    // raw.githubusercontent.com (which sits behind a CDN that can lag by
    // several minutes after a write). Using a second-resolution timestamp
    // keeps it stable within the same second so the 5s in-memory cache still
    // dedupes correctly.
    const buster = Math.floor(Date.now() / 1000);
    return `${RAW_BASE}/${c.owner}/${c.repo}/${c.branch}/${encodePath(path)}?t=${buster}`;
}
function rawHeaders() {
    // For private repos, raw.githubusercontent.com requires auth.
    const c = config();
    const h = {
        "User-Agent": "file-manager-nextjs"
    };
    if (c.token) {
        h.Authorization = `Bearer ${c.token}`;
    }
    return h;
}
const cache = new Map();
function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCached(key, data, ttlMs = CACHE_TTL_MS) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs
    });
}
function invalidate(key) {
    cache.delete(key);
}
// ---------------------------------------------------------------------------
// Low-level GitHub Contents API helpers
// ---------------------------------------------------------------------------
async function getRemoteSha(path) {
    const c = config();
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(c.branch)}`;
    const res = await fetch(url, {
        headers: authHeaders(c.token),
        cache: "no-store"
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(`Failed to fetch remote file ${path}: ${body.message || res.status}`);
    }
    const data = await res.json();
    return data.sha ?? null;
}
async function putRemote(path, contentBase64, message, knownSha) {
    const c = config();
    let sha = knownSha;
    if (!sha) {
        sha = await getRemoteSha(path).catch(()=>null);
    }
    const body = {
        message,
        content: contentBase64,
        branch: c.branch
    };
    if (sha) body.sha = sha;
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            ...authHeaders(c.token),
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        cache: "no-store"
    });
    if (res.status === 429 || res.status === 403) {
        const data = await res.json().catch(()=>({}));
        throw new Error(`GitHub rate limit: ${data.message || res.status}`);
    }
    if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(`GitHub write failed for ${path}: ${data.message || res.status}`);
    }
    const data = await res.json();
    return data.content?.sha ?? "";
}
async function deleteRemote(path, sha) {
    const c = config();
    const resolvedSha = sha ?? await getRemoteSha(path).catch(()=>null);
    if (!resolvedSha) return;
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            ...authHeaders(c.token),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Delete ${path}`,
            sha: resolvedSha,
            branch: c.branch
        }),
        cache: "no-store"
    });
    if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(()=>({}));
        throw new Error(`GitHub delete failed for ${path}: ${data.message || res.status}`);
    }
}
/**
 * Read a JSON file from the repo via the GitHub Contents API (not raw).
 * We use the API instead of raw.githubusercontent.com because the raw URL
 * sits behind a CDN that can lag by several minutes after a write, leading
 * to stale reads immediately after a mutation. The API always returns the
 * freshest content. Returns null when the file does not exist (404).
 */ async function readJson(path) {
    const c = config();
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(c.branch)}`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: authHeaders(c.token)
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`GitHub read failed for ${path}: ${res.status}`);
    }
    const data = await res.json();
    if (!data.content) return null;
    const text = data.encoding === "base64" ? Buffer.from(data.content, "base64").toString("utf-8") : data.content;
    if (!text.trim()) return null;
    try {
        return JSON.parse(text);
    } catch  {
        return null;
    }
}
/**
 * Read a raw text file from the repo. Uses raw.githubusercontent.com with a
 * cache-buster for speed; falls back to the Contents API on stale reads.
 */ async function readText(path) {
    const res = await fetch(rawUrl(path), {
        cache: "no-store",
        headers: rawHeaders()
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`GitHub read failed for ${path}: ${res.status}`);
    }
    return res.text();
}
/**
 * Read a binary file from the repo via raw.githubusercontent.com.
 */ async function readBytes(path) {
    const res = await fetch(rawUrl(path), {
        cache: "no-store",
        headers: rawHeaders()
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`GitHub read failed for ${path}: ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
}
async function writeJson(path, data, message) {
    const json = JSON.stringify(data, null, 2);
    const b64 = Buffer.from(json, "utf-8").toString("base64");
    await putRemote(path, b64, message);
}
// ---------------------------------------------------------------------------
// Metadata (file records)
// ---------------------------------------------------------------------------
const META_CACHE_KEY = "github:metadata";
async function getAllFileMeta() {
    const cached = getCached(META_CACHE_KEY);
    if (cached) return cached;
    if (!githubConfigured()) return {};
    const data = await readJson(METADATA_FILE).catch(()=>null);
    const files = data?.files ?? {};
    setCached(META_CACHE_KEY, files);
    return files;
}
async function getFileMeta(relativePath) {
    const all = await getAllFileMeta();
    return all[relativePath] ?? null;
}
async function getFileMetaById(id) {
    const all = await getAllFileMeta();
    // First try by id
    for (const k of Object.keys(all)){
        if (all[k].id === id) return all[k];
    }
    // Fallback: the list endpoint uses relativePath as id when no metadata
    // exists yet, so accept a relativePath match too.
    if (id in all) return all[id];
    return null;
}
async function saveFileMeta(meta) {
    const all = await getAllFileMeta();
    all[meta.relativePath] = meta;
    await writeJson(METADATA_FILE, {
        files: all
    }, `Update metadata for ${meta.relativePath}`);
    invalidate(META_CACHE_KEY);
}
async function saveManyFileMeta(entries) {
    if (entries.length === 0) return;
    const all = await getAllFileMeta();
    for (const e of entries)all[e.relativePath] = e;
    await writeJson(METADATA_FILE, {
        files: all
    }, `Bulk update ${entries.length} metadata entries`);
    invalidate(META_CACHE_KEY);
}
async function deleteFileMeta(relativePath) {
    const all = await getAllFileMeta();
    if (!(relativePath in all)) return;
    delete all[relativePath];
    await writeJson(METADATA_FILE, {
        files: all
    }, `Remove metadata for ${relativePath}`);
    invalidate(META_CACHE_KEY);
}
async function deleteFileMetaByPrefix(prefix) {
    const all = await getAllFileMeta();
    const removed = [];
    const p = prefix.endsWith("/") ? prefix : prefix + "/";
    for (const k of Object.keys(all)){
        if (k === prefix || k.startsWith(p)) {
            removed.push(all[k]);
            delete all[k];
        }
    }
    if (removed.length > 0) {
        await writeJson(METADATA_FILE, {
            files: all
        }, `Remove ${removed.length} metadata entries under ${prefix}`);
        invalidate(META_CACHE_KEY);
    }
    return removed;
}
async function reprefixFileMeta(oldPrefix, newPrefix) {
    const all = await getAllFileMeta();
    const updated = [];
    const p = oldPrefix.endsWith("/") ? oldPrefix : oldPrefix + "/";
    const np = newPrefix.endsWith("/") ? newPrefix : newPrefix + "/";
    for (const k of Object.keys(all)){
        if (k === oldPrefix) {
            const m = all[k];
            const next = {
                ...m,
                relativePath: newPrefix,
                updatedAt: new Date().toISOString()
            };
            delete all[k];
            all[newPrefix] = next;
            updated.push(next);
        } else if (k.startsWith(p)) {
            const m = all[k];
            const suffix = k.slice(p.length);
            const nextRel = np + suffix;
            const next = {
                ...m,
                relativePath: nextRel,
                updatedAt: new Date().toISOString()
            };
            delete all[k];
            all[nextRel] = next;
            updated.push(next);
        }
    }
    if (updated.length > 0) {
        await writeJson(METADATA_FILE, {
            files: all
        }, `Rename/move ${updated.length} entries from ${oldPrefix} to ${newPrefix}`);
        invalidate(META_CACHE_KEY);
    }
    return updated;
}
// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const USERS_CACHE_KEY = "github:users";
async function getAllUsers() {
    const cached = getCached(USERS_CACHE_KEY);
    if (cached) return cached;
    if (!githubConfigured()) return [];
    const data = await readJson(USERS_FILE).catch(()=>null);
    const users = data?.users ?? [];
    setCached(USERS_CACHE_KEY, users);
    return users;
}
async function getUserByUsername(username) {
    const users = await getAllUsers();
    return users.find((u)=>u.username === username) ?? null;
}
async function getUserById(id) {
    const users = await getAllUsers();
    return users.find((u)=>u.id === id) ?? null;
}
async function countAdmins() {
    const users = await getAllUsers();
    return users.filter((u)=>u.role === "ADMIN").length;
}
async function createUser(user) {
    const users = await getAllUsers();
    users.push(user);
    await writeJson(USERS_FILE, {
        users
    }, `Create admin ${user.username}`);
    invalidate(USERS_CACHE_KEY);
}
// ---------------------------------------------------------------------------
// Activity log (append-only JSONL)
// ---------------------------------------------------------------------------
const ACTIVITY_CACHE_KEY = "github:activity";
const ACTIVITY_CACHE_TTL = 5_000;
async function getAllActivity() {
    const cached = getCached(ACTIVITY_CACHE_KEY);
    if (cached) return cached;
    if (!githubConfigured()) return [];
    const text = await readText(ACTIVITY_FILE).catch(()=>null);
    if (!text) {
        setCached(ACTIVITY_CACHE_KEY, [], ACTIVITY_CACHE_TTL);
        return [];
    }
    const entries = [];
    for (const line of text.split("\n")){
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            entries.push(JSON.parse(trimmed));
        } catch  {
        /* skip malformed line */ }
    }
    // newest-first
    entries.reverse();
    setCached(ACTIVITY_CACHE_KEY, entries, ACTIVITY_CACHE_TTL);
    return entries;
}
async function appendActivity(entry) {
    // We need to append a line. GitHub's Contents API doesn't support append,
    // so we read current content, append, and write back.
    const existing = await readText(ACTIVITY_FILE).catch(()=>null);
    const next = (existing ? existing.trimEnd() + "\n" : "") + JSON.stringify(entry) + "\n";
    const b64 = Buffer.from(next, "utf-8").toString("base64");
    await putRemote(ACTIVITY_FILE, b64, `Log: ${entry.action} ${entry.target ?? ""}`);
    invalidate(ACTIVITY_CACHE_KEY);
}
// ---------------------------------------------------------------------------
// File versions
// ---------------------------------------------------------------------------
const VERSIONS_CACHE_KEY = "github:versions";
async function getVersionsForFile(fileId) {
    const cached = getCached(VERSIONS_CACHE_KEY);
    let data;
    if (cached) {
        data = cached;
    } else {
        data = await readJson(VERSIONS_FILE).catch(()=>null);
        if (data) setCached(VERSIONS_CACHE_KEY, data);
    }
    return data?.versions?.[fileId] ?? [];
}
async function addVersion(version) {
    const cached = getCached(VERSIONS_CACHE_KEY);
    let data;
    if (cached) {
        data = cached;
    } else {
        data = await readJson(VERSIONS_FILE).catch(()=>null) ?? {
            versions: {}
        };
    }
    if (!data.versions) data.versions = {};
    if (!data.versions[version.fileId]) data.versions[version.fileId] = [];
    data.versions[version.fileId].push(version);
    // cap at 50 versions per file to keep the file manageable
    if (data.versions[version.fileId].length > 50) {
        data.versions[version.fileId] = data.versions[version.fileId].slice(-50);
    }
    await writeJson(VERSIONS_FILE, data, `Add version for ${version.fileId}`);
    invalidate(VERSIONS_CACHE_KEY);
}
async function deleteVersionsForFile(fileId) {
    const cached = getCached(VERSIONS_CACHE_KEY);
    let data;
    if (cached) {
        data = cached;
    } else {
        data = await readJson(VERSIONS_FILE).catch(()=>null) ?? {
            versions: {}
        };
    }
    if (data.versions && data.versions[fileId]) {
        delete data.versions[fileId];
        await writeJson(VERSIONS_FILE, data, `Delete versions for ${fileId}`);
        invalidate(VERSIONS_CACHE_KEY);
    }
}
async function uploadFileContent(repoPath, bytes, message) {
    const b64 = Buffer.from(bytes).toString("base64");
    const sha = await putRemote(repoPath, b64, message);
    return {
        sha
    };
}
async function uploadFileText(repoPath, text, message) {
    const b64 = Buffer.from(text, "utf-8").toString("base64");
    const sha = await putRemote(repoPath, b64, message);
    return {
        sha
    };
}
async function getFileBytes(repoPath) {
    return readBytes(repoPath);
}
async function getFileText(repoPath) {
    return readText(repoPath);
}
async function deleteFileContent(repoPath, knownSha) {
    await deleteRemote(repoPath, knownSha);
}
async function createDirectory(repoPath) {
    const keepPath = repoPath ? `${repoPath}/.gitkeep` : ".gitkeep";
    await uploadFileText(keepPath, "", `Create directory ${repoPath || "/"}`);
}
async function listRepoEntries(repoPath) {
    const c = config();
    const cleanPath = repoPath.replace(/^\/+/, "");
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/contents/${encodePath(cleanPath)}?ref=${encodeURIComponent(c.branch)}`;
    const res = await fetch(url, {
        headers: authHeaders(c.token),
        cache: "no-store"
    });
    if (res.status === 404) return [];
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(`Failed to list ${repoPath}: ${body.message || res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return [
        data
    ];
}
/**
 * Recursively walk the repo and return every File entry. Cached for 10s.
 * Used by the file list / search / stats endpoints.
 */ const TREE_CACHE_KEY = "github:tree";
const TREE_TTL_MS = 10_000;
async function getRepoTree() {
    const cached = getCached(TREE_CACHE_KEY);
    if (cached) return cached;
    const c = config();
    // Use the Git Trees API with recursive=1 — single API call, returns everything.
    const url = `${GITHUB_API}/repos/${c.owner}/${c.repo}/git/trees/${encodeURIComponent(c.branch)}?recursive=1`;
    const res = await fetch(url, {
        headers: authHeaders(c.token),
        cache: "no-store"
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(`Failed to fetch repo tree: ${body.message || res.status}`);
    }
    const data = await res.json();
    const entries = (data.tree || []).filter((t)=>t.type === "blob" || t.type === "tree").map((t)=>({
            name: t.path.split("/").pop() || t.path,
            path: t.path,
            type: t.type === "tree" ? "dir" : "file",
            size: t.size ?? 0,
            sha: t.sha
        }));
    setCached(TREE_CACHE_KEY, entries, TREE_TTL_MS);
    return entries;
}
function invalidateTree() {
    cache.delete(TREE_CACHE_KEY);
}
async function repoPathExists(repoPath) {
    const entries = await getRepoTree();
    const clean = repoPath.replace(/^\/+/, "");
    return entries.some((e)=>e.path === clean);
}
async function pingGithub() {
    const c = config();
    if (!c.token || !c.owner || !c.repo) {
        return {
            reachable: false,
            error: "Not configured"
        };
    }
    try {
        const res = await fetch(`${GITHUB_API}/repos/${c.owner}/${c.repo}`, {
            headers: authHeaders(c.token),
            cache: "no-store"
        });
        if (res.status === 401) return {
            reachable: false,
            error: "Bad credentials"
        };
        if (res.status === 404) return {
            reachable: false,
            error: "Repository not found"
        };
        if (!res.ok) return {
            reachable: false,
            error: `HTTP ${res.status}`
        };
        return {
            reachable: true
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error("github.ping.error", {
            message
        });
        return {
            reachable: false,
            error: message
        };
    }
}
function repoRawUrl(repoPath) {
    return rawUrl(repoPath);
}
function repoConfig() {
    return config();
}
}),
"[project]/src/lib/base-url.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBaseUrl",
    ()=>getBaseUrl,
    "getClientBaseUrl",
    ()=>getClientBaseUrl
]);
// ===========================================================================
// Base URL resolution (server + client)
// ---------------------------------------------------------------------------
// getBaseUrl reads the incoming request headers (x-forwarded-proto +
// x-forwarded-host, falling back to host) and validates against the optional
// TRUSTED_HOSTS env var. Never hard-codes a domain.
// ===========================================================================
const FALLBACK = "http://localhost:3000";
function readTrustedHosts() {
    const raw = process.env.TRUSTED_HOSTS;
    if (!raw) return [];
    return raw.split(",").map((h)=>h.trim().toLowerCase()).filter(Boolean);
}
function isValidHost(host, trusted) {
    if (trusted.length === 0) return true; // not configured = trust incoming
    const h = host.toLowerCase();
    // Allow exact + subdomain matches
    return trusted.some((t)=>h === t || h.endsWith("." + t));
}
function getBaseUrl(headers) {
    const h = headers ?? new Headers();
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "http");
    const hostRaw = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host") || "";
    const trusted = readTrustedHosts();
    if (!hostRaw || !isValidHost(hostRaw, trusted)) {
        return FALLBACK;
    }
    return `${proto}://${hostRaw}`;
}
function getClientBaseUrl() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return FALLBACK;
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/src/lib/constants.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ===========================================================================
// Application constants
// ===========================================================================
// File extensions that can be edited in the in-browser Monaco editor.
__turbopack_context__.s([
    "ACTIONS",
    ()=>ACTIONS,
    "ALLOWED_MIME",
    ()=>ALLOWED_MIME,
    "DANGEROUS_EXECUTABLE_EXTENSIONS",
    ()=>DANGEROUS_EXECUTABLE_EXTENSIONS,
    "DEFAULT_PAGE_SIZE",
    ()=>DEFAULT_PAGE_SIZE,
    "EDITABLE_EXTENSIONS",
    ()=>EDITABLE_EXTENSIONS,
    "EXTENSION_TO_MONACO_LANGUAGE",
    ()=>EXTENSION_TO_MONACO_LANGUAGE,
    "MAX_PAGE_SIZE",
    ()=>MAX_PAGE_SIZE,
    "MAX_UPLOAD_SIZE_BYTES",
    ()=>MAX_UPLOAD_SIZE_BYTES,
    "UPLOADS_ROUTE_PREFIX",
    ()=>UPLOADS_ROUTE_PREFIX
]);
const EDITABLE_EXTENSIONS = [
    "txt",
    "html",
    "htm",
    "css",
    "js",
    "mjs",
    "cjs",
    "json",
    "xml",
    "php",
    "md",
    "markdown",
    "yaml",
    "yml",
    "ts",
    "tsx",
    "jsx",
    "csv",
    "log",
    "env",
    "ini",
    "conf",
    "sh",
    "py",
    "sql",
    "svg"
];
const ALLOWED_MIME = new Set([
    // Text / documents
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "text/csv",
    "text/markdown",
    "text/xml",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/x-yaml",
    "application/yaml",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/x-icon",
    "image/avif",
    // PDF / office
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    "application/gzip",
    "application/x-gzip",
    "application/x-tar",
    "application/x-7z-compressed",
    // Audio / video
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "video/mp4",
    "video/webm",
    "video/ogg",
    // Code-ish
    "application/x-php",
    "application/x-sh",
    "application/x-httpd-php"
]);
const DANGEROUS_EXECUTABLE_EXTENSIONS = new Set([
    "php",
    "phtml",
    "phar",
    "php3",
    "php4",
    "php5",
    "php7",
    "phps",
    "asp",
    "aspx",
    "jsp",
    "exe",
    "bat",
    "cmd",
    "sh",
    "bash",
    "pl",
    "py",
    "rb",
    "cgi"
]);
const UPLOADS_ROUTE_PREFIX = "/uploads";
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;
const MAX_UPLOAD_SIZE_BYTES = Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB || "100", 10) * 1024 * 1024;
const ACTIONS = {
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    UPLOAD: "UPLOAD",
    UPLOAD_MULTIPLE: "UPLOAD_MULTIPLE",
    CREATE_FILE: "CREATE_FILE",
    CREATE_FOLDER: "CREATE_FOLDER",
    EDIT: "EDIT",
    RENAME: "RENAME",
    MOVE: "MOVE",
    DELETE: "DELETE",
    INDEX_ENABLED: "INDEX_ENABLED",
    INDEX_DISABLED: "INDEX_DISABLED",
    GOOGLE_STATUS_CHECK: "GOOGLE_STATUS_CHECK",
    GOOGLE_INDEX_REQUEST: "GOOGLE_INDEX_REQUEST",
    GITHUB_SYNC: "GITHUB_SYNC",
    GITHUB_DELETE: "GITHUB_DELETE"
};
const EXTENSION_TO_MONACO_LANGUAGE = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    htm: "html",
    css: "css",
    xml: "xml",
    svg: "xml",
    php: "php",
    md: "markdown",
    markdown: "markdown",
    yaml: "yaml",
    yml: "yaml",
    py: "python",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    csv: "plaintext",
    txt: "plaintext",
    log: "plaintext",
    env: "ini",
    ini: "ini",
    conf: "ini"
};
}),
"[project]/src/lib/security.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "created",
    ()=>created,
    "fail",
    ()=>fail,
    "getClientIp",
    ()=>getClientIp,
    "getExtension",
    ()=>getExtension,
    "getServerSessionUser",
    ()=>getServerSessionUser,
    "hashPassword",
    ()=>hashPassword,
    "isAllowedMime",
    ()=>isAllowedMime,
    "isExtensionDangerous",
    ()=>isExtensionDangerous,
    "isExtensionEditable",
    ()=>isExtensionEditable,
    "isWithinUploadSize",
    ()=>isWithinUploadSize,
    "ok",
    ()=>ok,
    "sanitizeFilename",
    ()=>sanitizeFilename,
    "sanitizeRelativePath",
    ()=>sanitizeRelativePath,
    "verifyPassword",
    ()=>verifyPassword
]);
// ===========================================================================
// Server-side security helpers
// ---------------------------------------------------------------------------
// All functions here MUST run on the server only. They handle password
// hashing, path sanitization, MIME validation and session helpers.
// Never import this module from a client component.
//
// NOTE: This module no longer touches the local filesystem — all persistence
// goes through the GitHub store. Only pure helpers remain.
// ===========================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-route] (ecmascript)");
;
;
;
;
// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------
const BCRYPT_ROUNDS = 10;
async function hashPassword(plain) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(plain, BCRYPT_ROUNDS);
}
async function verifyPassword(plain, hash) {
    if (!hash) return false;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(plain, hash);
}
// ---------------------------------------------------------------------------
// Filename / path sanitization
// ---------------------------------------------------------------------------
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
function sanitizeFilename(name) {
    if (typeof name !== "string" || name.length === 0) return "untitled";
    // Take only the basename — never allow directory separators through.
    const base = name.split(/[/\\]/).pop() || name;
    let cleaned = base.replace(INVALID_FILENAME_CHARS, "_").trim();
    // Collapse consecutive underscores / dots
    cleaned = cleaned.replace(/^\.+/, "").replace(/_{2,}/g, "_");
    if (cleaned.length === 0) cleaned = "untitled";
    if (cleaned.length > 180) {
        const ext = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(cleaned);
        cleaned = cleaned.slice(0, 180 - ext.length).trimEnd() + ext.toLowerCase();
    }
    if (RESERVED_WINDOWS_NAMES.test(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].basename(cleaned, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(cleaned)))) {
        cleaned = "_" + cleaned;
    }
    // Never allow a sanitized name to start with ".file-manager" — that's our
    // internal metadata namespace.
    if (cleaned.toLowerCase() === ".file-manager" || cleaned.toLowerCase().startsWith(".file-manager/")) {
        cleaned = "_" + cleaned;
    }
    return cleaned;
}
function sanitizeRelativePath(input) {
    if (typeof input !== "string") return "";
    const trimmed = input.trim().replace(/^[/\\]+/, "").replace(/[/\\]+$/, "");
    if (!trimmed) return "";
    const segments = trimmed.split(/[/\\]+/).filter(Boolean);
    const clean = [];
    for (const seg of segments){
        if (seg === ".." || seg === ".") continue;
        const s = sanitizeFilename(seg);
        if (s) clean.push(s);
    }
    // Reject paths that try to enter the private metadata namespace.
    if (clean[0]?.toLowerCase() === ".file-manager") return "";
    return clean.join("/");
}
function getExtension(name) {
    const ext = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(name).toLowerCase().replace(/^\./, "");
    return ext;
}
function isExtensionDangerous(ext) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DANGEROUS_EXECUTABLE_EXTENSIONS"].has(ext.toLowerCase());
}
function isExtensionEditable(ext) {
    const set = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EDITABLE_EXTENSIONS"]);
    return set.has(ext.toLowerCase());
}
function isAllowedMime(mime) {
    if (!mime) return false;
    const lower = mime.toLowerCase().split(";")[0].trim();
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALLOWED_MIME"].has(lower);
}
function isWithinUploadSize(sizeBytes) {
    return Number.isFinite(sizeBytes) && sizeBytes > 0 && sizeBytes <= __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAX_UPLOAD_SIZE_BYTES"];
}
async function getServerSessionUser() {
    // Lazy import so this file stays decoupled from next-auth at module load.
    const { getServerSession } = await __turbopack_context__.A("[project]/node_modules/next-auth/index.js [app-route] (ecmascript, async loader)");
    const { authOptions } = await __turbopack_context__.A("[project]/src/lib/auth.ts [app-route] (ecmascript, async loader)");
    const session = await getServerSession(authOptions);
    const u = session?.user;
    if (!u || !u.id) return null;
    return {
        id: u.id,
        username: u.username || u.name || "unknown",
        role: u.role || "ADMIN"
    };
}
function getClientIp(headers) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    return headers.get("x-real-ip") || headers.get("x-client-ip") || null;
}
function ok(data, message) {
    return Response.json({
        success: true,
        message,
        data
    }, {
        status: 200
    });
}
function created(data, message) {
    return Response.json({
        success: true,
        message,
        data
    }, {
        status: 201
    });
}
function fail(message, status = 400, extra) {
    return Response.json({
        success: false,
        message,
        ...extra
    }, {
        status
    });
}
}),
"[project]/src/lib/filesystem.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildPublicUrl",
    ()=>buildPublicUrl,
    "computeUniqueRelativePath",
    ()=>computeUniqueRelativePath
]);
// ===========================================================================
// Filesystem helpers (server-only)
// ---------------------------------------------------------------------------
// NOTE: There is no local disk storage. All files live in the GitHub repo.
// This module now provides only path sanitization + public URL building.
// The actual file CRUD happens via `lib/github-store.ts`.
// ===========================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/security.ts [app-route] (ecmascript)");
;
;
;
async function computeUniqueRelativePath(destFolder, filename, existingPaths) {
    const safeFolder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeRelativePath"])(destFolder);
    const safeName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeFilename"])(filename);
    const candidate = safeFolder ? `${safeFolder}/${safeName}` : safeName;
    if (!existingPaths.has(candidate)) return candidate;
    const lastDot = safeName.lastIndexOf(".");
    const base = lastDot > 0 ? safeName.slice(0, lastDot) : safeName;
    const ext = lastDot > 0 ? safeName.slice(lastDot) : "";
    let i = 1;
    while(i < 10_000){
        const next = `${base}-${i}${ext}`;
        const path = safeFolder ? `${safeFolder}/${next}` : next;
        if (!existingPaths.has(path)) return path;
        i++;
    }
    const fallback = `${base}-${Date.now()}${ext}`;
    return safeFolder ? `${safeFolder}/${fallback}` : fallback;
}
function buildPublicUrl(relativePath) {
    const clean = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeRelativePath"])(relativePath);
    if (!clean) return "/uploads";
    const encoded = clean.split("/").map((seg)=>encodeURIComponent(seg)).join("/");
    return `/uploads/${encoded}`;
}
}),
"[project]/src/lib/sitemap.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildRobotsTxt",
    ()=>buildRobotsTxt,
    "generateSitemap",
    ()=>generateSitemap,
    "invalidateSitemap",
    ()=>invalidateSitemap
]);
// ===========================================================================
// Sitemap generation
// ---------------------------------------------------------------------------
// Builds an XML sitemap from the GitHub-stored file metadata where
// isIndexed = true and isDirectory = false. Uses getBaseUrl() so the URLs
// match the host the site is served from.
// ===========================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$github$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/github-store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$base$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/base-url.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$filesystem$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/filesystem.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/security.ts [app-route] (ecmascript)");
;
;
;
;
;
function escapeXml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
async function generateSitemap(headers) {
    const baseUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$base$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBaseUrl"])(headers);
    const all = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$github$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAllFileMeta"])();
    const files = Object.values(all).filter((f)=>f.isIndexed && !f.isDirectory).sort((a, b)=>a.updatedAt < b.updatedAt ? 1 : -1);
    const urls = files.map((f)=>{
        const loc = `${baseUrl}${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$filesystem$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildPublicUrl"])(f.relativePath)}`;
        const lastmod = new Date(f.updatedAt).toISOString();
        return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
async function invalidateSitemap() {
// No-op: the sitemap is computed fresh on every request.
// Kept for API symmetry with the rest of the codebase.
}
function buildRobotsTxt(headers) {
    const baseUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$base$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBaseUrl"])(headers);
    return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}
;
}),
"[project]/src/app/sitemap.xml/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ===========================================================================
// GET /sitemap.xml — dynamically generated from DB (isIndexed files only)
// ===========================================================================
__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sitemap$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/sitemap.ts [app-route] (ecmascript) <locals>");
;
const dynamic = "force-dynamic";
async function GET(req) {
    const xml = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sitemap$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateSitemap"])(req.headers);
    return new Response(xml, {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=600"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ecd628a9._.js.map