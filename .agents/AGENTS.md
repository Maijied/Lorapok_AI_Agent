# Lorapok AI Agent Workspace Rules (.agents/AGENTS.md)

## Workspace Configuration & Scope

Agent governance for the `lorapok_ai_agent` repository.

### Key Directories

- `.agents/rules/` — Mandatory project rules (`.mdc`)
- `.agents/hooks.json` + `.agents/hooks/` — Lifecycle hooks
- `.agents/automations/` — Automation drafts
- `.agents/skills/`, `.agents/steer/`, `.agents/subagents/`
- `Docs/` — Architecture, API, CLI, providers
- `packages/sdk/` — Multi-client HTTP SDK
- `apps/website/` — Marketing site
- `commands/registry.js` — Slash command registry
- `services/Model*.js` — Sanitized model catalog
- `tests/` — Jest (23 suites / 270 tests)

### Developer & Agent Directives

- **Zero Test Regressions**: `npm test` must pass (270+) before finishing.
- **Rules first**: Load `.agents/rules/` + steer + skills at task start.
- **Models**: Usable vs paid only via ModelManager views; Google free-API ≠ paid.
- **Docs sync**: Update root + `.agents` BRAIN/AGENTS and `Docs/` when architecture changes.
- **NPM Cache Cleanup**: `npm cache clean --force` after task completion.

### Universal Agent Workflow

1. Read rules, steer, skills, BRAIN, Docs/architecture
2. Execute changes (CommonJS, logger, tests)
3. `npm test` → sync docs → cache clean
