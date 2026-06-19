# SnipForge — VS Code Extension

Save, browse, and insert code snippets directly from your editor. No account, no internet, no setup.

Snippets are stored in the same local SQLite file as the SnipForge CLI (`~/.snipforge/snippets.db`), so anything you save from VS Code is immediately available in the terminal and vice versa.

## Installation

Search **"SnipForge"** in the VS Code Extensions panel (`Ctrl+Shift+X`) and click **Install**.

Or from the terminal:
```bash
code --install-extension swayamyadav05.snipforge
```

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for any of these:

### SnipForge: Save Selection

1. Select the code you want to save (or select nothing to save the whole file)
2. Run **SnipForge: Save Selection**
3. Enter a title
4. Enter optional tags (comma-separated), or press Enter to skip

The language is detected automatically from the file you're editing. A confirmation shows the title, language, and slug — you can use the slug to retrieve the snippet from the CLI with `snipforge get <slug>`.

### SnipForge: List Snippets

Opens a searchable list of all your saved snippets. Select one to insert its code at your cursor. If no editor is open, the code is copied to your clipboard instead.

Snippets saved from the CLI appear here automatically — no import needed.

### SnipForge: Get Snippet by Slug

Enter a snippet's slug to insert it at your cursor directly. Useful when you already know the slug from `snipforge list`.

## Storage

Snippets are saved to `~/.snipforge/snippets.db` — a plain SQLite file that the CLI also reads and writes. Nothing leaves your machine.

---

## Development

If you want to contribute or run from source:

**Prerequisites:** Node.js 18+, VS Code. Bun is optional (only needed if you want to use `bun run` for dev scripts).

```bash
git clone https://github.com/swayamyadav05/snipforge
cd SnipForge
bun install
```

Press `F5` in VS Code to open an Extension Development Host with SnipForge loaded.

**To package as a `.vsix` for local install:**
```bash
npm install -g @vscode/vsce
cd apps/vscode-ext
vsce package
code --install-extension snipforge-vscode-0.0.2.vsix
```

**To publish to the VS Code Marketplace:**
```bash
vsce login your-publisher-name   # requires a Microsoft account + PAT
vsce publish
```
