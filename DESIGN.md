# DevSnap — Design Document

**Status:** Design complete (Phases 1–8). Ready to build (next step: Milestone 0).
**Version:** 0.2
**Last updated:** 2026-06-17

> A personal code-snippet manager that lets a developer save a snippet once and
> retrieve it from wherever they're working — terminal, editor, or browser —
> built as a Turborepo monorepo on top of InsForge.

---

## 1. Vision & Scope

**What it is:** Save a useful code snippet once, in flow, and get it back from any
surface you happen to be working on. One snippet, one source of truth, three front
ends (web, CLI, VS Code) over a single shared core.

**MVP scope (in):** single user, private snippets, save / search / retrieve / tag /
edit / delete, across three surfaces built **in sequence**.

**MVP scope (out — deferred):** sharing / public snippets / teams / collections;
realtime sync; tag rename/merge; code-body (full-text) search; mobile-responsive UI;
offline support.

**Surface sequencing:** `packages/core` + `apps/web` first → `apps/cli` →
`apps/vscode-ext`. Building one surface at a time is intentional — a schema change
should produce compile errors in any surface that has drifted out of sync, and you
want to _feel_ `core` get reused on surface #2.

---

## 2. Architecture & Stack

### Mental model

`packages/core` is the shared brain (domain logic). InsForge is the backend
(Postgres, auth, auto-generated APIs, AI gateway). The surfaces are thin UIs.

```
                packages/core  (shared client + domain logic)
                ┌────────────────────────────────┐
                │ Zod types · InsForge wrapper ·  │
                │ language detection · slug gen   │
                └────────────────────────────────┘
                   ▲          ▲          ▲
              apps/cli   apps/web   apps/vscode-ext
                   │          │          │
                   └──────────┴──────────┘
                              ▼
                    ┌──────────────────┐
                    │     InsForge     │  ← Postgres, auth, APIs
                    └──────────────────┘
```

There is **no separate API server** — InsForge is the backend, and `core`'s typed
functions _are_ the interface every surface programs against.

### Tech stack (locked)

**Bun · Turborepo · TypeScript · Next.js · Tailwind + shadcn/ui · highlight.js · Zod · InsForge**
— and deliberately **no tRPC** and **no custom API server**.

- **Bun** as package manager + runtime. Bonus: the CLI can later compile to a
  standalone Bun binary — a clean `devsnap` distribution.
- **highlight.js** for syntax highlighting _and_ content-based language detection —
  one library covers both needs and runs in browser + Bun, so `core` owns a single
  `detectLanguage` reused across surfaces.
- **Tailwind + shadcn/ui** for the web UI.
- **Zod** for runtime validation _and_ as the source of truth for `core`'s types.

### Monorepo layout

```
devsnap/
├── apps/
│   └── web/                 # Next.js — built first
│                            #   (later: cli/, vscode-ext/)
├── packages/
│   ├── core/                # shared domain logic, InsForge client, types
│   └── tsconfig/            # shared base tsconfig
├── package.json             # workspace root
├── bunfig / workspace config
└── turbo.json               # task pipeline (core builds before web)
```

No `packages/ui` yet — there's only one React surface. Add it only when a second
surface actually wants to share components.

### What lives in `core` (the key discipline)

`core` **owns** (all pure TypeScript, environment-agnostic): the Zod schemas + types
(single source of truth), the InsForge client wrapper + typed domain functions,
language detection (`detectLanguage`, `languageFromExtension`), and slug generation.

`core` is **banned** from importing React, Next.js, the DOM, terminal/ANSI code, or
the VS Code API. The moment `core` imports React, the CLI can't use it.
**Rule of thumb: detection logic (pure) goes in `core`; rendering (platform-specific)
lives in the surface.**

### Language detection per surface

- **Web** — `detectLanguage(code)` (highlight.js auto) prefills the language picker;
  user can override.
- **CLI** — `languageFromExtension(filename)` (`.ts` → `typescript`).
- **VS Code** — read `editor.document.languageId` directly.

### Why no tRPC

tRPC delivers typesafe client↔server calls, but it **requires a server defining
procedures** — which we deliberately removed by choosing InsForge. The end-to-end
type safety it provides is already delivered here by `core`'s shared, Zod-derived
types flowing to every surface. Adding tRPC would duplicate that guarantee _and_
re-introduce the server layer InsForge let us skip. Revisit only if real server-side
business logic (that can't live on the client or in RLS) ever appears.

---

## 3. User Stories

Tagged **[MVP]** or **[Later]** (Later = CLI/extension surface, or a deferred extra).

**Capturing**

- Save a snippet with a title. [MVP]
- Have a language set on each snippet (highlight + filter). [MVP]
- Add tags when saving. [MVP]
- Add an optional note/description. [MVP]
- Save straight from a file (`devsnap add file.js`). [Later — CLI]
- Save a selected block from the editor. [Later — extension]

**Finding**

- Search snippets by keyword. [MVP]
- Filter by tag. [MVP]
- Filter by language. [MVP]
- Browse all snippets in a list. [MVP]

**Using**

- View a snippet with syntax highlighting. [MVP]
- Copy a snippet to clipboard in one click. [MVP]
- Fetch a snippet by slug in the terminal. [Later — CLI]
- Insert a snippet at the cursor in VS Code. [Later — extension]

**Organizing**

- Edit a snippet's code/title/tags. [MVP]
- Delete a snippet. [MVP]
- Rename or merge tags. [Later]

**Auth / account**

- Sign in with GitHub. [MVP]
- Keep snippets private by default. [MVP]
- Stay logged in across sessions. [MVP]
- Authenticate the CLI once. [Later — CLI]

---

## 4. Functional Requirements (MVP — web + `core`)

**Auth**

- **FR-1** — Sign in via GitHub OAuth (through InsForge).
- **FR-2** — Persist the session across visits until sign-out.
- **FR-3** — Scope all snippet data to the authenticated user, enforced server-side
  via InsForge RLS.
- **FR-4** — Provide a sign-out action.

**Capture**

- **FR-5** — Create a snippet with code (required), title (required), tags (optional,
  multiple), description (optional).
- **FR-6** — Set the snippet's language automatically, per surface (file extension on
  CLI, editor language in VS Code, content best-guess + picker on web).
- **FR-7** — Let the user override / set the language manually.
- **FR-8** — Generate a unique slug per snippet; duplicate titles allowed.

**Find**

- **FR-9** — List all of the user's snippets.
- **FR-10** — Keyword search over title + description.
- **FR-11** — Filter by one or more tags.
- **FR-12** — Filter by language.
- **FR-13** — Render code with language-appropriate syntax highlighting.
- **FR-14** — Show a clear empty state when search/filter returns nothing.

**Use**

- **FR-15** — Copy a snippet's code to clipboard in one action.

**Manage**

- **FR-16** — Edit a snippet's title, code, tags, description, language.
- **FR-17** — Delete a snippet, with a confirmation step.

---

## 5. Non-functional Requirements

**Security & privacy** — per-user isolation via InsForge RLS (_a snippet is
readable/writable only by the user whose ID matches the row's owner_). Sessions via
InsForge JWT; secrets in env only, never in the client bundle, never committed.

**Performance** — list/search/open/copy feel instant (sub-~300 ms perceived);
client-side filtering after initial load is acceptable for MVP. Saving stays snappy —
language detection runs locally.

**Reliability** — API/network failures show a clear message and never lose
in-progress input (a failed save keeps the code in the editor). Expired session
redirects cleanly to sign-in.

**Maintainability (the monorepo payoff)** — all domain logic lives in `core` as the
single source of truth; surfaces hold only UI + glue. Shared types flow _from_ `core`,
so a schema change produces compile errors in any drifted surface.

**Out of scope for MVP** — mobile-responsive UI (desktop-first); offline support.

---

## 6. Data Model

One core table.

```
snippets
──────────────────────────────────────────────────────────
id           uuid         PK, default gen_random_uuid()
user_id      uuid         NOT NULL                     ← RLS key
title        text         NOT NULL
description  text         NULL
code         text         NOT NULL
language     text         NOT NULL   e.g. "typescript"
slug         text         NOT NULL, UNIQUE  e.g. "debounce-fn-a8x2"
tags         text[]       NOT NULL, default '{}'
created_at   timestamptz  NOT NULL, default now()
updated_at   timestamptz  NOT NULL, default now()

+ GIN index on tags        (fast tag filtering — FR-11)
+ index on user_id         (every query filters by it)
```

- **Slug:** `slugify(title) + short suffix` — readable, collision-safe without an
  insert-time lookup, reusable as a public URL later.
- **Tags:** array column with GIN index. Fully serves all MVP tag needs with one
  table and one RLS policy. Normalized `tags` + `snippet_tags` deferred until
  rename/merge is needed (then: a one-time backfill migration).
- **Language:** `text`, not enum — a new language never needs a migration.
- **Search:** title + description via `ILIKE` — no extra columns. Code-body search
  deferred (belongs to the future public-discovery mode).
- **RLS policy (plain English):** for every operation, a row is accessible only when
  its `user_id` equals the current authenticated user's id. (Exact "current user"
  function confirmed against InsForge at wiring time.)

---

## 7. The `core` Contract

Since there's no tRPC/API server, **these signatures are the entire backend
interface.** Every surface programs against this.

```typescript
// ───── Types (Zod-derived, single source of truth) ─────

export const snippetSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  language: z.string(),
  tags: z.array(z.string()).default([]),
});

type Snippet = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};                          // no user_id — RLS guarantees it's always yours

type CreateSnippetInput = {
  title: string;
  code: string;
  language: string;         // surface resolves this before calling (required)
  description?: string;
  tags?: string[];          // defaults to []
};

type UpdateSnippetInput = Partial<
  Pick<Snippet, "title" | "code" | "language" | "description" | "tags">
>;

type SnippetFilters = {
  search?: string;          // matches title + description (FR-10)
  tags?: string[];          // AND semantics — must contain all (FR-11)
  language?: string;        // FR-12
};

// ───── Auth ─────
signInWithGitHub(): Promise<Session>      // web OAuth redirect; CLI device-flow added at M5
signOut(): Promise<void>
getSession(): Promise<Session | null>

// ───── Snippets ─────
createSnippet(input: CreateSnippetInput): Promise<Snippet>               // FR-5, 8
listSnippets(filters?: SnippetFilters): Promise<Snippet[]>               // FR-9,10,11,12
getSnippetBySlug(slug: string): Promise<Snippet | null>                  // view / CLI get
updateSnippet(id: string, changes: UpdateSnippetInput): Promise<Snippet> // FR-16
deleteSnippet(id: string): Promise<void>                                 // FR-17

// ───── Detection helpers (pure) ─────
detectLanguage(code: string): string                    // highlight.js auto — web
languageFromExtension(filename: string): string | null  // ".ts" → "typescript" — CLI
// generateSlug(title) is internal to createSnippet
```

**Principles baked in:**

- **Ownership is implicit** — no function takes `user_id`; `core` reads the session
  and RLS enforces it. Callers cannot touch another user's data.
- **The surface resolves language, then passes it in.** `core` provides the
  detectors but doesn't guess inside `createSnippet`.
- **Slug is generated internally** by `createSnippet`.
- **One query function** — `listSnippets(filters?)` covers list + search + filter.

---

## 8. Build Milestones

**Vertical slices, not horizontal layers.** Each milestone goes end-to-end and is
runnable/demoable before the next begins.

**Web MVP**

- **M0 — Scaffold + backend.** Turborepo/Bun workspace; `snippets` table + RLS +
  GitHub OAuth in InsForge; `core` InsForge SDK wiring + Zod schemas/types.
- **M1 — Auth, end to end.** `signInWithGitHub` / `signOut` / `getSession`; web
  sign-in, protected dashboard shell. (First, because everything depends on a user.)
- **M2 — Create + List.** `createSnippet` (+ `generateSlug`, `detectLanguage`),
  `listSnippets`; new-snippet form + list view. _Now useful to you._
- **M3 — View + Highlight + Copy.** `getSnippetBySlug`; detail view with highlight.js
  - one-click copy (FR-13, FR-15).
- **M4 — Find + Manage.** `listSnippets` filters, `updateSnippet`, `deleteSnippet`;
  search, tag/language filters, edit, delete-with-confirm, empty states. **Web MVP
  complete — FR-1…17 satisfied.**

**Other surfaces (sequenced after web)**

- **M5 — CLI.** Imports the _same_ `core` (createSnippet/listSnippets/getSnippetBySlug
  reused verbatim). New: Bun CLI + command parsing, `languageFromExtension`, GitHub
  device-flow auth. _Where the monorepo payoff becomes tangible._
- **M6 — VS Code extension.** Reuses `core` again. New: extension scaffold + webview,
  `editor.document.languageId`, insert-at-cursor, sidebar UI.

**Working with Claude Code:** hand it **one milestone at a time** and review each
before moving on. This doc is the spec; each milestone is a reviewable unit small
enough to read, understand, and defend — keeping you the one who understands the
system rather than one-shotting an app you can't explain.

---

## 9. Decisions Log

1. **Design-first, then build** with Claude Code + InsForge.
2. **Surfaces sequenced** (`core`+web → CLI → extension) to feel the monorepo payoff.
3. **Single-user, private MVP** — no sharing/teams in v1.
4. **InsForge is the backend** — no `apps/api`, no custom API server.
5. **Auth = GitHub OAuth via InsForge** — devs all have GitHub; free to set up; gives
   real dev identity for the future sharing layer.
6. **Search = title + description** — code-body search belongs to future discovery mode.
7. **Duplicate titles allowed; slug is the unique key.**
8. **Language auto-set is surface-dependent** (extension / editor / content guess);
   always user-overridable.
9. **Slug = `slugify(title) + short suffix`.**
10. **Tags = array column** now; normalized tables deferred until rename/merge.
11. **Mobile + offline out of scope** for MVP.
12. **`core` is the single source of truth**; surfaces hold only UI + glue.
13. **`language` stored as `text`, not enum.**
14. **Bun** as package manager + runtime (CLI → standalone binary later).
15. **Turborepo**; no `packages/ui` until a second React surface needs it.
16. **highlight.js** — does both highlighting and content auto-detect; runs in
    browser + Bun.
17. **Tailwind + shadcn/ui** for web styling.
18. **Zod** — runtime validation _and_ source of truth for `core` types (`z.infer`).
19. **No tRPC** — redundant with InsForge's generated API + `core`'s shared types;
    would re-introduce the deleted server layer.
20. **Tag filtering = AND** (must contain all selected tags).
21. **`CreateSnippetInput.language` required** — surface resolves it before calling.
22. **`listSnippets(filters?)`** — one query function for list/search/filter.
23. **Ownership implicit** (session + RLS); no `user_id` passed by callers.
24. **Build in vertical slices**, milestone-by-milestone with Claude Code.
