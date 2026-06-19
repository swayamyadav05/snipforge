# SnipForge

A personal code snippet manager for developers. Save snippets from your terminal or VS Code editor and reuse them across any project — no cloud account required, everything stays on your machine.

## Tools

### CLI — `snipforge`

Install globally with any package manager — Node.js 18+ is all that's required:

```bash
npm install -g snipforge
# pnpm / yarn / bun also work
```

[CLI docs →](apps/cli/README.md)

### VS Code Extension

Search **"SnipForge"** in the VS Code Extensions panel and click Install.

Or install from the command line:
```bash
code --install-extension swayamyadav05.snipforge
```

[Extension docs →](apps/vscode-ext/README.md)

### Web App

Browse, search, and manage your snippets in the browser.

[Web app docs →](apps/web/README.md)

---

## How storage works

The CLI and VS Code extension share a single SQLite file at `~/.snipforge/snippets.db`. Save a snippet from either tool and it's instantly visible in the other — no sync, no cloud, nothing leaving your machine.

| Tool | Reads/writes |
|---|---|
| CLI (`snipforge`) | `~/.snipforge/snippets.db` |
| VS Code extension | `~/.snipforge/snippets.db` |
| Web app | Insforge cloud DB (per-user, requires sign-in) |

## Contributing / Development

**Prerequisites:** [Bun](https://bun.sh) (for the dev environment), Node.js 18+

```bash
git clone https://github.com/swayamyadav05/snipforge
cd SnipForge
bun install
bun run dev     # starts all apps in watch mode
```

### Repo layout

```
SnipForge/
├── apps/
│   ├── cli/           # snipforge CLI (Node.js runtime, esbuild bundle)
│   ├── vscode-ext/    # VS Code extension (esbuild bundle)
│   └── web/           # Next.js snippet browser
└── packages/
    ├── core/          # Shared schema, DB client, language detection, highlighting
    └── typescript-config/   # Shared tsconfig base files
```

`packages/core` is the single source of truth — schema changes surface as TypeScript errors in all three apps immediately. Turborepo handles task orchestration and caching so unchanged packages don't rebuild.
