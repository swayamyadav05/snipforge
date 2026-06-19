# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager:** Bun. All installs and scripts use `bun`.

```bash
bun install               # install all workspace deps
bun run build             # turbo: build all packages/apps
bun run dev               # turbo: start all apps in watch mode
bun run lint              # turbo: lint all
bun run check-types       # turbo: tsc --noEmit across all
bun run format            # prettier write on all ts/tsx/md
```

**Per-app commands (run from the app directory):**

| App | Dev | Build |
|---|---|---|
| `apps/cli` | `bun run src/index.ts` | `bun build.mjs` |
| `apps/vscode-ext` | `node esbuild.mjs --watch` | `node esbuild.mjs` |
| `apps/web` | `next dev --port 3000` | `next build` |

There are no test files in this repo yet.

## Architecture

### Repo layout

```
DevSnap/
├── apps/
│   ├── cli/           # snipforge CLI (Bun + Commander)
│   ├── vscode-ext/    # VS Code extension (esbuild bundle)
│   └── web/           # Next.js 16 App Router snippet browser
└── packages/
    ├── core/          # Shared schema, cloud DB client, language detection, highlighting
    └── typescript-config/   # Shared tsconfig bases (base, nextjs, react-library)
```

### packages/core

The shared library. All apps import from `@devsnap/core`.

- **Schema** (`src/schema.ts`) — Zod schemas and TypeScript types: `Snippet`, `CreateSnippetInput`, `UpdateSnippetInput`, `SnippetFilters`
- **Client** (`src/client.ts`) — `insforge` client (Supabase-compatible SDK). Reads `NEXT_PUBLIC_INSFORGE_PROJECT_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` from env.
- **Snippets** (`src/snippets.ts`) — CRUD functions (`createSnippet`, `listSnippets`, `getSnippet`, `updateSnippet`, `deleteSnippet`) against the cloud DB via `insforge`. RLS enforces per-user isolation automatically.
- **Auth** (`src/auth.ts`) — GitHub OAuth via `insforge.auth` (`signInWithGitHub`, `signOut`, `getSession`)
- **Detect** (`src/detect.ts`) — `detectLanguage(code)` uses `highlight.js` `highlightAuto`; `languageFromExtension(filename)` maps file extensions to language names
- **Highlight** (`src/highlight.ts`) — `highlightCode` wraps `highlight.js`

### Data store split (important)

Each surface has its **own** local storage — they do **not** share the same DB:

| App | Store | Location |
|---|---|---|
| `apps/web` | Insforge cloud DB | Remote, per-user via RLS |
| `apps/cli` | SQLite via `bun:sqlite` | `~/.devsnap/snippets.db` |
| `apps/vscode-ext` | VS Code `globalState` | VS Code's internal key-value store |

The CLI and VS Code extension use `core`'s schema types but **not** its `snippets.ts` functions — they write to their own local stores directly.

### apps/cli

Binary name: `snipforge`. Three commands:
- `snipforge add [file]` — reads from file path, stdin pipe, or interactive paste; detects language from file extension or `core`'s `detectLanguage`
- `snipforge get <slug>` — prints snippet code to stdout
- `snipforge list` — tabular view of all saved snippets

Built by `bun build.mjs` → `dist/snipforge.js` (prepends `#!/usr/bin/env bun` shebang).

### apps/vscode-ext

Command palette entry: **"SnipForge: Save Selection"** (`snipforge.saveSelection`).

Saves selected text (or whole file if nothing selected) into VS Code's `globalState`. Language is detected from the editor's `languageId` via a hardcoded `VSCODE_LANG_MAP`. Bundled as CJS by esbuild with `vscode` marked external.

### apps/web

Next.js 16 with the App Router. All pages are `'use client'` components.

- `/` — Sign-in page, redirects to `/dashboard` if already authed
- `/dashboard` — Protected layout; calls `getSession()` on mount, redirects to `/` if unauthenticated
- `/dashboard` (page) — Snippet list with client-side search/language/tag filtering
- `/dashboard/new` — Create snippet form; auto-detects language from pasted code (500ms debounce)

Styling: Tailwind CSS + `highlight.js/styles/github-dark.css`.

### Environment variables

The web app (and `packages/core`) requires:

```
NEXT_PUBLIC_INSFORGE_PROJECT_URL=<your insforge project URL>
NEXT_PUBLIC_INSFORGE_ANON_KEY=<your insforge anon key>
```

Place these in `apps/web/.env.local`.
