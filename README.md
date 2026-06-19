# SnipForge

A personal code snippet manager for developers. Save snippets from your terminal or VS Code editor and reuse them across any project — no cloud account required, everything stays on your machine.

## Tools

### CLI — `snipforge`

Install globally and use from any terminal:

```bash
bun add -g snipforge
# or
npm install -g snipforge
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

## Contributing / Development

If you want to build on SnipForge or run everything locally:

**Prerequisites:** [Bun](https://bun.sh) and [Turborepo](https://turborepo.dev) (`bun add -g turbo`)

```bash
git clone https://github.com/swayamyadav05/snipforge
cd SnipForge
bun install
turbo dev     # starts all apps in watch mode
```

### Repo layout

```
SnipForge/
├── apps/
│   ├── cli/           # snipforge CLI (Bun + commander)
│   ├── vscode-ext/    # VS Code extension (esbuild bundle)
│   └── web/           # Next.js snippet browser
└── packages/
    ├── core/          # Shared schema, DB client, language detection, highlighting
    └── typescript-config/   # Shared tsconfig base files
```

`packages/core` is the single source of truth — schema changes surface as TypeScript errors in all three apps immediately. Turborepo handles task orchestration and caching so unchanged packages don't rebuild.
