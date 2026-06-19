# SnipForge CLI

Save and retrieve code snippets from your terminal. Everything is stored locally — no account, no internet required.

## Installation

```bash
bun add -g snipforge
# or
npm install -g snipforge
```

Verify it works:

```bash
snipforge --version
```

## Commands

### `snipforge add` — Save a snippet

**From a file:**
```bash
snipforge add src/hooks/useDebounce.ts
```
Reads the file, auto-detects the language from the file extension, then asks for a title and optional tags.

**From stdin (pipe):**
```bash
cat src/utils/format.ts | snipforge add --title "Format currency"
pbpaste | snipforge add --title "CSS grid trick" --tags "css,layout"
```
`--title` is required when piping. `--tags` is optional (comma-separated).

**Interactive paste:**
```bash
snipforge add
```
Asks for title and tags first, then prompts you to paste code. Press `Ctrl+D` when done.

---

### `snipforge list` — Browse your snippets

```bash
snipforge list
```

```
SLUG                  TITLE                      LANG        TAGS
use-debounce-a3f2     useDebounce hook           typescript  react, hooks
format-currency-9k1   Format currency            typescript  utils
css-grid-trick-b4e8   CSS grid trick             css         css, layout
```

---

### `snipforge get <slug>` — Retrieve a snippet

```bash
snipforge get use-debounce-a3f2
```

Prints the code to stdout. Pipe it anywhere:

```bash
snipforge get use-debounce-a3f2 | pbcopy                     # copy to clipboard (macOS)
snipforge get use-debounce-a3f2 | xclip -selection clipboard # copy to clipboard (Linux)
snipforge get use-debounce-a3f2 > src/hooks/useDebounce.ts   # write to a file
```

## Storage

Snippets are saved to `~/.snipforge/snippets.db` — a SQLite file on your machine. Nothing leaves your computer.

---

## Development

If you want to contribute or run from source:

```bash
git clone https://github.com/swayam-yadav/snipforge
cd SnipForge
bun install
bun run apps/cli/src/index.ts   # run without installing
```

To register locally as the `snipforge` command:
```bash
cd apps/cli
bun link
```
