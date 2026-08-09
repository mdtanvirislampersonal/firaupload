# File Manager — GitHub-Backed Web Admin Console

A production-ready, SaaS-style file manager built with **Next.js 16 + TypeScript + shadcn/ui**. Features drag-and-drop uploads, folder management, an in-browser Monaco code editor, selective Google indexing, dynamic sitemap generation, GitHub sync, activity logs, secure auth, responsive dashboard, and dark mode.

---

## ⚠️ ARCHITECTURE — NO DATABASE

**This file manager has no database.** Everything — files, metadata, users, activity logs, file versions — lives in a **GitHub repository**. You must configure a GitHub repo + token to use it.

### What lives where on GitHub

```
<your-repo>/
├── .file-manager/              # ← internal state (do not edit by hand)
│   ├── metadata.json           # file metadata (indexing flags, google status, sha, ...)
│   ├── users.json              # admin users (bcrypt-hashed passwords)
│   ├── activity.jsonl          # append-only activity log (one JSON object per line)
│   └── versions.json           # file version snapshots (keyed by fileId)
│
├── documents/                  # ← your uploaded files live here, at the repo root
│   └── report.pdf
├── images/
│   └── logo.png
└── test-notes.md
```

- **Uploaded files** are committed directly to the repo at their destination path.
- **Metadata** (indexing flag, Google status, SHA, size, timestamps) is stored in `.file-manager/metadata.json`.
- **Users** are stored in `.file-manager/users.json` with bcrypt-hashed passwords.
- **Activity logs** are appended to `.file-manager/activity.jsonl`.
- **File versions** (snapshots of previous content when you save in the editor) live in `.file-manager/versions.json`.

### How public file serving works

The `/uploads/<path>` route does **not** read from local disk. It proxies to `raw.githubusercontent.com` (with auth, so private repos work) and streams the file back with the correct Content-Type. Dangerous executable extensions (`.php`, `.phtml`, `.phar`, `.exe`, `.bat`, `.sh`, ...) are forced to `application/octet-stream` with `Content-Disposition: attachment` so they **never execute**.

### Caching

- The repo tree (file list) is cached in-memory for 10 seconds.
- Metadata, users, and activity logs are cached for 5 seconds.
- All caches are invalidated on write, so mutations are immediately visible.

---

## ⚠️ SECURITY WARNING — ROTATE THE LEAKED GITHUB TOKEN

> The GitHub Personal Access Token used to demonstrate this app was shared in plaintext during development. **You MUST rotate it immediately** if you fork or deploy this project:
>
> 1. Visit https://github.com/settings/tokens (or your fine-grained PAT settings).
> 2. Revoke the existing token.
> 3. Generate a new one with **Contents: Read and Write** on the target repository only.
> 4. Replace the `GITHUB_TOKEN` value in your `.env` file.
> 5. **Never** commit `.env` to git. This repo's `.gitignore` already excludes it.

The token is stored ONLY in the server-side `.env` file and is never exposed to client-side JavaScript. It is referenced exclusively by `src/lib/github-store.ts` (a `server-only` module). It is never logged.

---

## Quick start

```bash
# 1. Install deps
bun install

# 2. Configure environment
cp .env.example .env
#   - set GITHUB_OWNER, GITHUB_REPOSITORY, GITHUB_TOKEN
#   - set GITHUB_ENABLED="true"
#   - generate AUTH_SECRET:    openssl rand -base64 32
#   - leave GOOGLE_* empty to disable Google indexing

# 3. Start the dev server
bun run dev
```

Then open the preview. The `/` route redirects to `/dashboard`, which (when no session exists) redirects to `/login`. **First time?** Visit `/setup` to create the first admin account.

### Available scripts

| Script | Description |
| --- | --- |
| `bun run dev` | Start the dev server on port 3000 (auto-restarts on file changes) |
| `bun run lint` | Run ESLint |

> `bun run build` is intentionally disabled in this sandbox. For production builds use the Dockerfile.

---

## Environment variables

All variables live in `.env` (gitignored). Copy `.env.example` for the template.

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_ENABLED` | yes | Set to `"true"` to enable GitHub-backed storage. |
| `GITHUB_OWNER` | yes | The repository owner (user or org). |
| `GITHUB_REPOSITORY` | yes | The repository name. |
| `GITHUB_BRANCH` | yes | The branch to commit to (default `main`). |
| `GITHUB_TOKEN` | yes | A fine-grained PAT with `Contents: Read and Write` on the repo. |
| `AUTH_SECRET` | yes | A random string ≥ 32 chars. Generate with `openssl rand -base64 32`. |
| `ADMIN_USERNAME` | no | Suggested username on the setup screen. |
| `MAX_UPLOAD_SIZE_MB` | no | Max upload size in MB (default `100`). |
| `TRUSTED_HOSTS` | no | Comma-separated list of allowed hosts for sitemap/robots URL generation. Leave empty to trust the incoming Host header. |
| `GOOGLE_INDEXING_ENABLED` | no | Set to `"true"` to enable Google Indexing API integration. |
| `GOOGLE_CLIENT_ID` | no | Google OAuth client ID (for Indexing API). |
| `GOOGLE_CLIENT_SECRET` | no | Google OAuth client secret. |
| `GOOGLE_REFRESH_TOKEN` | no | Google OAuth refresh token. |

---

## First-run setup

1. Visit `/setup`.
2. Choose a username and password (≥ 8 chars).
3. Click **Create admin account**.
4. You'll be redirected to `/login`. Sign in with your new credentials.
5. After the first admin is created, `/setup` becomes inaccessible.

The admin record is stored in `.file-manager/users.json` on GitHub with a bcrypt-hashed password.

---

## Features

### File management
- Upload single / multiple / drag-and-drop with progress
- Create folders (GitHub doesn't track empty dirs, so we commit a `.gitkeep`)
- Create text files (txt, html, css, js, json, xml, php, md, ...)
- Rename / move / delete (recursive for folders)
- Download (streams from GitHub via the proxy route)
- Preview (images inline, PDF in browser, text in Monaco editor)

### Code editor
- Monaco Editor with syntax highlighting, line numbers, search/replace
- Ctrl+S to save
- Unsaved-changes indicator
- Dark mode follows theme
- On save: a FileVersion snapshot of the previous content is stored in `.file-manager/versions.json`

### Selective indexing
- Per-file toggle: Indexed / No-Index
- Only indexed files appear in `/sitemap.xml`
- Toggling updates `.file-manager/metadata.json` on GitHub and the sitemap regenerates immediately

### Sitemap & robots
- `/sitemap.xml` — dynamically generated from metadata where `isIndexed = true`
- `/robots.txt` — `User-agent: *\nAllow: /\n\nSitemap: <baseUrl>/sitemap.xml`
- Base URL is auto-detected from request headers (`x-forwarded-proto`, `x-forwarded-host`, `host`)
- Never hard-codes a domain

### GitHub sync
- Since files LIVE on GitHub, "sync" refreshes the stored SHA from the repo tree
- "Sync all" updates SHAs for every file record in one pass
- Conflict detection: if the remote SHA differs from the stored one, a conflict is reported

### Google indexing (optional)
- When `GOOGLE_INDEXING_ENABLED=false`, the panel shows a clear "disabled" state
- When enabled, uses the Google Indexing API + URL Inspection API
- Never fakes a success response — always tells the truth about what Google returned
- Status stored in metadata: `INDEXED`, `NOT_INDEXED`, `UNKNOWN`, `CHECKING`, `ERROR`, `DISABLED`

### Activity logs
- Every meaningful action is logged: LOGIN, LOGOUT, UPLOAD, UPLOAD_MULTIPLE, CREATE_FILE, CREATE_FOLDER, EDIT, RENAME, MOVE, DELETE, INDEX_ENABLED, INDEX_DISABLED, GOOGLE_STATUS_CHECK, GOOGLE_INDEX_REQUEST, GITHUB_SYNC, GITHUB_DELETE
- Stored in `.file-manager/activity.jsonl` (append-only)
- Viewable at `/dashboard/logs` with filter + pagination

### Security
- NextAuth v4 with CredentialsProvider + bcryptjs password hashing
- Middleware protects `/dashboard/*` and all private `/api/*` routes
- Path traversal prevention on all file operations
- Dangerous executable extensions forced to download
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- Server-side logger with secret redaction (never logs passwords or tokens)

### UI/UX
- Modern SaaS dashboard with sidebar + header
- 7 stat cards (Total Files, Indexed, No-Index, Total Storage, Google Indexed/Not Indexed, GitHub Synced)
- File browser: list/grid views, search, 10 filters, 6 sort options, pagination, multi-select, per-file action menu
- Dark mode (light/dark/system, persisted via next-themes)
- Responsive: sidebar becomes drawer on mobile, dialogs fit small screens
- Toast notifications (sonner), skeleton loaders, empty states

---

## Deployment

### Docker

```bash
docker compose up -d
```

The `docker-compose.yml` runs the Next.js app on port 3000. Configure all environment variables in a `.env` file (see `.env.example`).

> Note: Since there's no database, the docker-compose file only starts the Next.js app. No MySQL/Postgres container is needed.

### Vercel / Netlify / any Node host

1. Set all environment variables in your host's dashboard.
2. Deploy. The app is a standard Next.js 16 app.

### GitHub repo setup

1. Create a new GitHub repository (public or private — both work).
2. Generate a fine-grained PAT with **Contents: Read and Write** on that repo.
3. Set `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GITHUB_BRANCH`, and `GITHUB_TOKEN` in your `.env`.
4. The app will automatically create the `.file-manager/` directory and files on first use.

---

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Auth**: NextAuth v4 (CredentialsProvider + bcryptjs)
- **Editor**: @monaco-editor/react
- **Validation**: Zod
- **Forms**: react-hook-form + @hookform/resolvers
- **Icons**: lucide-react
- **State**: TanStack Query + Zustand
- **Notifications**: sonner
- **Storage**: GitHub (via REST API + raw.githubusercontent.com proxy)

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # redirects to /dashboard
│   ├── login/page.tsx
│   ├── setup/page.tsx              # first-admin setup
│   ├── dashboard/                  # protected dashboard
│   │   ├── layout.tsx
│   │   ├── page.tsx                # stats overview
│   │   ├── files/page.tsx
│   │   ├── indexed/page.tsx
│   │   ├── google/page.tsx
│   │   ├── github/page.tsx
│   │   ├── sitemap/page.tsx
│   │   ├── editor/[id]/page.tsx    # Monaco editor
│   │   ├── logs/page.tsx
│   │   └── settings/page.tsx
│   ├── uploads/[...path]/route.ts  # proxies from raw.githubusercontent.com
│   ├── sitemap.xml/route.ts
│   ├── robots.txt/route.ts
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── setup/route.ts
│       ├── files/                  # CRUD + upload + content + save
│       ├── indexing/               # toggle + status + request
│       ├── github/                 # status + sync + upload + delete
│       ├── stats/route.ts
│       └── logs/route.ts
├── components/
│   ├── dashboard/                  # Sidebar, Header, FileBrowser, dialogs, ...
│   ├── editor/CodeEditor.tsx
│   ├── google/GoogleIndexPanel.tsx
│   ├── github/GithubSyncPanel.tsx
│   └── providers/                  # Theme, Query, Session
└── lib/
    ├── github-store.ts             # ← the "database" — GitHub-backed JSON store
    ├── github.ts                   # high-level sync facade
    ├── auth.ts                     # NextAuth config
    ├── security.ts                 # password hashing, path sanitization, MIME validation
    ├── filesystem.ts               # path helpers + public URL builder
    ├── sitemap.ts                  # generateSitemap()
    ├── google.ts                   # Google Indexing API
    ├── activity.ts                 # logActivity()
    ├── base-url.ts                 # getBaseUrl() from request headers
    ├── validation.ts               # Zod schemas
    ├── constants.ts                # extensions, MIME types, action constants
    └── logger.ts                   # server-side logger with secret redaction
```

---

## License

MIT
