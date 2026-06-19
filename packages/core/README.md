# @devsnap/core

The shared brain of the DevSnap monorepo. Every app imports from here — schema, DB calls, language detection, and syntax highlighting all live in one place so they never drift out of sync.

## Why this exists

Without a shared core, each app would define its own `Snippet` type and make its own DB calls. Change a field name in the web app → CLI silently uses the old name → data mismatch.

With core, this becomes a build-time error: change `Snippet` here → TypeScript errors appear in all three apps immediately.

## What it exports

```typescript
// Schema and types (Zod)
export { SnippetSchema, CreateSnippetInputSchema, UpdateSnippetInputSchema, SnippetFiltersSchema }
export type { Snippet, CreateSnippetInput, UpdateSnippetInput, SnippetFilters, User }

// Database CRUD (InsForge / PostgreSQL)
export { createSnippet, listSnippets, getSnippet, updateSnippet, deleteSnippet }

// Auth (InsForge GitHub OAuth)
export { signInWithGitHub, signOut, getSession }

// Language detection (highlight.js)
export { detectLanguage, languageFromExtension }

// Syntax highlighting (returns HTML string)
export { highlightCode }

// Raw InsForge client (for one-off queries)
export { insforge }
```

## The `Snippet` type

```typescript
type Snippet = {
  id: string           // UUID
  slug: string         // URL-safe title-derived identifier, e.g. "use-debounce-a3f2"
  title: string
  description: string | null
  code: string
  language: string     // highlight.js language name, e.g. "typescript", "bash"
  tags: string[]
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
}
```

## Who uses what

| Export | Used by |
|---|---|
| `Snippet` type | All three apps |
| `createSnippet`, `listSnippets`, etc. | `apps/web` only (InsForge, requires auth) |
| `detectLanguage` | `apps/web` (auto-detect in new snippet form), `apps/cli` |
| `languageFromExtension` | `apps/cli` (detect from file path) |
| `highlightCode` | `apps/web` (syntax-highlighted detail view) |
| `signInWithGitHub`, `getSession` | `apps/web` only |

**Not used by the VS Code extension:** The extension uses VS Code's own `editor.document.languageId` for detection and does not call the DB functions. Bundling highlight.js into a VS Code extension causes WSL memory issues (~2.8MB bundle).

## How imports resolve

Three different resolution mechanisms are in play depending on which app is running:

| Context | How `@devsnap/core` resolves |
|---|---|
| TypeScript editor (LSP) | `tsconfig.json` paths alias → `../../packages/core/src/index.ts` |
| Next.js webpack build | `transpilePackages: ['@devsnap/core']` in `next.config.js` → workspace symlink |
| Bun runtime (CLI) | Bun workspace resolution → `packages/core/src/index.ts` directly |

All three end up at the same file. The paths alias is just there so the editor doesn't show red squiggles.

## Development

This package has no build step — apps import from `src/index.ts` directly. TypeScript transpiles it inline as part of each app's own build.

```bash
turbo check-types --filter=@devsnap/core
```
