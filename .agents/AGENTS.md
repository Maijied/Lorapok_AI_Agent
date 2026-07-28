# Lorapok AI Agent Workspace Rules (.agents/AGENTS.md)

## Workspace Configuration & Scope
This file provides context and rules for AI agents operating within the `Lorapok_AI_Agent` repository.

### Key Directories
- `.agents/`: Contains project-level custom skills, subagents, steering rules, and agent workflows.
- `bin/`: CLI binaries (`lorapok.js`).
- `commands/`: CLI command definitions (git, chat, actions, settings, auth, system, workflow).
- `lib/`: Core agent implementation, configuration, history, rendering, UI components.
- `services/`: Core logic services for Git, File management, Actions, and GitHub OAuth.
- `tests/`: Jest unit and corner-case test suites.
- `website/` & `LorapokAiBuild/`: Static UI presentation pages and GitHub Pages builds.

### Developer & Agent Directives
- **Zero Test Regressions**: Ensure `npm test` runs with 100% passing rate before finishing any task.
- **Docker Fallback**: Maintain backwards compatibility with Docker compose environments (`docker-compose.yml`, `Dockerfile`).
- **Interactive Shell Handling**: Respect CLI non-interactive modes when running under automated environments or CI.
- **Token Efficiency**: Use targeted line-range file reads (`StartLine`/`EndLine`), chunked edits, and `BRAIN.md` lookup to conserve prompt context tokens.

