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
- `tests/` — Jest (46 suites / 579 tests)

### Developer & Agent Directives

- **Zero Test Regressions**: `npm test` must pass (579+) before finishing.
- **Rules first**: Load `.agents/rules/` + steer + skills at task start.
- **Models**: Usable vs paid only via ModelManager views; Google free-API ≠ paid.
- **Docs sync**: Update root + `.agents` BRAIN/AGENTS and `Docs/` when architecture changes.
- **NPM Cache Cleanup**: `npm cache clean --force` after task completion.

### 🔄 Universal Agent Workflow

1. **Initialization**: Read rules (`.agents/rules/`), steering (`.agents/steer/`), skills, `BRAIN.md`, and `Docs/architecture`.
2. **Execution**: Implement changes adhering to CommonJS, logger standards, and testing mandates.
3. **Verification**: Run `npm test` to ensure zero regressions.
4. **Post-Prompt Trigger (MANDATORY)**: *After your prompt response is complete (or immediately before concluding your task)*, you MUST evaluate if `BRAIN.md`, `AGENTS.md`, `README.md`, or `Docs/` require updates based on your changes. Sync docs and clean cache (`npm cache clean --force`).
