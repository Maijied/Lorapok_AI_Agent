# ADR-001: Monorepo-ready layout

## Decision

Keep the **npm-published agent at repo root** for 1.x stability. Add:

- `apps/website/` (moved from `website/`)
- `packages/sdk/` for shared HTTP client
- `Docs/` for architecture and API

## Consequences

- Phase 2 may extract `packages/agent` with npm workspaces
- Paths in skills/BRAIN must reference `apps/website`
