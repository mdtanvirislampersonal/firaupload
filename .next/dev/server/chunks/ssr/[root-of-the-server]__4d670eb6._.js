module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/lib/logger.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
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
"[project]/src/lib/github-store.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/logger.ts [app-rsc] (ecmascript)");
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
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$logger$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logger"].error("github.ping.error", {
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
"[project]/src/app/setup/SetupForm.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/setup/SetupForm.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/setup/SetupForm.tsx <module evaluation>", "default");
}),
"[project]/src/app/setup/SetupForm.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/setup/SetupForm.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/setup/SetupForm.tsx", "default");
}),
"[project]/src/app/setup/SetupForm.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$setup$2f$SetupForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/setup/SetupForm.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$setup$2f$SetupForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/app/setup/SetupForm.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$setup$2f$SetupForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/setup/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SetupPage,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$github$2d$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/github-store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$setup$2f$SetupForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/setup/SetupForm.tsx [app-rsc] (ecmascript)");
;
;
;
;
const dynamic = "force-dynamic";
async function SetupPage() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$github$2d$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["githubConfigured"])()) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-md text-center space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-xl font-semibold",
                        children: "GitHub not configured"
                    }, void 0, false, {
                        fileName: "[project]/src/app/setup/page.tsx",
                        lineNumber: 12,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-muted-foreground text-sm",
                        children: [
                            "Set ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "px-1 py-0.5 bg-muted rounded",
                                children: "GITHUB_OWNER"
                            }, void 0, false, {
                                fileName: "[project]/src/app/setup/page.tsx",
                                lineNumber: 14,
                                columnNumber: 17
                            }, this),
                            ",",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "px-1 py-0.5 bg-muted rounded",
                                children: "GITHUB_REPOSITORY"
                            }, void 0, false, {
                                fileName: "[project]/src/app/setup/page.tsx",
                                lineNumber: 15,
                                columnNumber: 13
                            }, this),
                            ",",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "px-1 py-0.5 bg-muted rounded",
                                children: "GITHUB_TOKEN"
                            }, void 0, false, {
                                fileName: "[project]/src/app/setup/page.tsx",
                                lineNumber: 16,
                                columnNumber: 13
                            }, this),
                            " and",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "px-1 py-0.5 bg-muted rounded",
                                children: "GITHUB_ENABLED=true"
                            }, void 0, false, {
                                fileName: "[project]/src/app/setup/page.tsx",
                                lineNumber: 17,
                                columnNumber: 13
                            }, this),
                            " ",
                            "in your environment to use the file manager."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/setup/page.tsx",
                        lineNumber: 13,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/setup/page.tsx",
                lineNumber: 11,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/setup/page.tsx",
            lineNumber: 10,
            columnNumber: 7
        }, this);
    }
    const adminCount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$github$2d$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["countAdmins"])();
    if (adminCount > 0) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/login");
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$setup$2f$SetupForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
        fileName: "[project]/src/app/setup/page.tsx",
        lineNumber: 28,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/app/setup/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/setup/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4d670eb6._.js.map