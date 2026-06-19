# DevSnap Web

A Next.js app for browsing, searching, and managing snippets saved to the cloud store (InsForge/PostgreSQL).

This is a companion to the CLI and VS Code extension — it gives snippets a visual home and makes them searchable when you can't remember a slug.

> **Note:** The web app uses a separate data store from the CLI and VS Code extension. Cloud sync across all three is a future milestone.

## Features

- Dashboard listing all your snippets
- Search by title or description
- Filter by language (dropdown) and tags (clickable chips)
- Full snippet detail view with syntax highlighting and a copy button
- Create, edit, and delete snippets
- GitHub OAuth login (auth handled by InsForge)

## Prerequisites

InsForge must be running locally:

```bash
# InsForge runs at http://localhost:7134 by default
# Start it before running the web app
```

## Running locally

From the repo root:

```bash
turbo dev --filter=web
```

Or directly:

```bash
cd apps/web
bun dev
```

Opens at [http://localhost:3000](http://localhost:3000).

Sign in with GitHub to see your snippets. The GitHub OAuth callback URL must be set to `http://localhost:7134/api/auth/oauth/github/callback` in your InsForge project settings.

## How it uses `packages/core`

`apps/web` does not call InsForge directly. All DB calls go through `@devsnap/core`:

```
apps/web components
  → import { listSnippets, createSnippet, ... } from '@devsnap/core'
  → packages/core/src/snippets.ts
  → InsForge SDK → PostgreSQL (with RLS)
```

Row-Level Security (RLS) is enforced at the database level — each user only ever sees their own snippets, even if the query doesn't include a user filter. This happens automatically because InsForge injects `auth.uid()` into the RLS policy.

## Key files

| File | Purpose |
|---|---|
| `app/dashboard/page.tsx` | List view — search, language filter, tag filter |
| `app/dashboard/new/page.tsx` | New snippet form with auto language detection |
| `app/dashboard/s/[slug]/page.tsx` | Detail view — highlight, copy, delete |
| `app/dashboard/s/[slug]/edit/page.tsx` | Edit form |
| `app/layout.tsx` | Imports `highlight.js/styles/github-dark.css` globally |
| `next.config.js` | `transpilePackages: ['@devsnap/core']` — needed for workspace package imports |
