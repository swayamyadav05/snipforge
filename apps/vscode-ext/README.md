# SnipForge — VS Code Extension

Save code snippets directly from your editor with one command. No account, no internet, no setup.

## Installation

Search **"SnipForge"** in the VS Code Extensions panel (`Ctrl+Shift+X`) and click **Install**.

Or from the terminal:
```bash
code --install-extension swayam-yadav.snipforge
```

## Usage

1. Select the code you want to save (or select nothing to save the whole file)
2. Open the Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
3. Run **SnipForge: Save Selection**
4. Enter a title
5. Enter optional tags (comma-separated), or press Enter to skip

You'll see a confirmation: `SnipForge: Saved "your title" [language]`

The language is detected automatically from the file you're editing — no manual selection needed.

## Storage

Snippets are saved in VS Code's built-in storage (`globalState`), scoped to this extension. They persist across restarts automatically. Nothing leaves your machine.

---

## Development

If you want to contribute or run from source:

**Prerequisites:** [Bun](https://bun.sh), VS Code

```bash
git clone https://github.com/swayam-yadav/snipforge
cd SnipForge
bun install
```

Press `F5` in VS Code to open an Extension Development Host with SnipForge loaded.

**To package as a `.vsix` for local install:**
```bash
bun add -g @vscode/vsce
cd apps/vscode-ext
vsce package
code --install-extension snipforge-0.0.1.vsix
```

**To publish to the VS Code Marketplace:**
```bash
vsce login your-publisher-name   # requires a Microsoft account + PAT
vsce publish
```
