# CLI Slash Commands & @ Mentions

Source of truth: [`commands/registry.js`](../../commands/registry.js).

## Slash (`/`)

Type `/` alone for the autocomplete palette. Unknown commands print a hint (they do not open the system menu).

Key commands: `/chat`, `/plan`, `/analyze`, `/model`, `/settings`, `/refresh-models`, `/cache`, `/config`, `/bypass`, `/git`, `/actions`, `/files`, `/guide`, `/help`, `/exit`.

## @ Mentions

- `@` alone → file picker
- `@path/to/file` → inline file into the next chat turn
- Multi-file `@a @b` supported; large files are skipped with a warning
