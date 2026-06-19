# DevSnap — Code Snippet Ecosystem

A monorepo where a CLI, VS Code extension, and web app all share one brain.

## The idea

Developers save code snippets from three places (terminal, editor, browser) and they all sync to the same store. `packages/core` is the single source of truth — schema changes, parser logic, and DB calls live there once and flow to every app automatically.

## Repo layout

```
DevSnap/
├── apps/
│   ├── web/           # Next.js — browse, search, share snippets
│   ├── cli/           # devsnap add / devsnap get <slug>
│   └── vscode-ext/    # Right-click → "Save as DevSnap"
└── packages/
    └── core/          # Snippet schema, syntax highlighter, DB client
```

## Apps

### apps/web (Next.js)
- Snippet browser with search and filtering by language/tag
- Public snippet sharing via slug URL
- Syntax-highlighted preview using core's highlighter

### apps/cli
- `devsnap add` — pipe stdin or a file path into the store
- `devsnap get <slug>` — copy a snippet to clipboard or stdout
- `devsnap list` — table view of saved snippets

### apps/vscode-ext
- Command palette: "DevSnap: Save Selection"
- Picks up language from the active editor automatically
- Calls core's save function directly — no HTTP round-trip needed locally

## packages/core

Everything shared:
- **Schema** — `Snippet` type: `{ id, slug, title, language, body, tags, createdAt }`
- **DB client** — wraps SQLite (local) or a hosted DB (cloud sync)
- **Parser** — extracts language, strips leading whitespace, generates slug from title
- **Highlighter** — thin wrapper around shiki so web and CLI render the same colors

## Tech choices (to decide when building)

| Concern | Candidate |
|---|---|
| Monorepo tooling | Turborepo |
| Package manager | pnpm workspaces |
| Language | TypeScript throughout |
| Local DB | SQLite via `better-sqlite3` |
| Syntax highlighting | shiki |
| CLI framework | commander or yargs |
| VS Code ext | `vscode` API + esbuild bundle |
| Web styling | Tailwind CSS |

## Key monorepo benefit

Change `Snippet` schema in `packages/core` → TypeScript errors surface in all three apps immediately. No API contract drift, no duplicated types.

## First steps when starting

1. `pnpm init` + `turbo.json` at root
2. Scaffold `packages/core` with the `Snippet` type and a SQLite client
3. Build `apps/cli` first — fastest feedback loop, no UI needed
4. Wire `apps/web` next — core is already tested via CLI
5. Add `apps/vscode-ext` last — it bundles core as a dependency

## Out of scope (for now)

- Cloud sync / authentication
- Snippet versioning
- Team sharing / access control
