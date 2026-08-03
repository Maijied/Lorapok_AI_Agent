# 🧠 Lorapok AI Agent - Central System Brain (BRAIN.md)

> **LIVING SYSTEM MEMORY & KNOWLEDGE BASE**  
> *Last Synced: 2026-08-03 | Version: 1.7.0 | Test Suite: 46/46 Passed (579 Tests)*

---

## 📌 Executive Summary

**Lorapok AI Agent** is an action-oriented AI Coding Agent with CLI + Express REST API, multi-provider LLM orchestration (Google AI Studio, OpenRouter, Perplexity), and a monorepo-ready layout for web/mobile clients via `packages/sdk`.

### Key Points
1. **CLI & API** — `bin/lorapok.js`, `index.js`, `server.js`
2. **Sanitized model catalog** — `ModelManager` + `ModelValidator` + menu/API views (usable vs paid)
3. **Command registry** — `commands/registry.js` drives `/` palette, system menu, `/help`
4. **Docs & agents** — `Docs/`, `.agents/rules|hooks|automations|skills`
5. **Clients** — `apps/website`, `packages/sdk` (future Android/iOS)

---

## 🏗️ Module Map

```
lorapok_ai_agent/
├── bin/ lorapok.js
├── commands/          # registry.js + handlers
├── lib/               # agent, core schema, config, ui, menu-format
├── services/          # Orchestrator, ModeRouter, ContextAssembler, IndexerService, Model*, Git, File
├── server.js
├── packages/sdk/      # HTTP client stub
├── apps/website/      # marketing site
├── Docs/              # architecture, api, cli, providers
├── .agents/           # skills, steer, rules, hooks, automations
└── tests/             # Jest (44 suites / 570 tests)
```

See [Docs/architecture/MODULE_MAP.md](Docs/architecture/MODULE_MAP.md).

---

## 📊 Live Metrics

- Node.js >= 18
- Jest: **46 suites, 579 tests passing**
- Model sanitize: `ModelSanitizeService` + `ModelAccessService` + `ActiveModelService`
- Secrets: `SecretsVault` AES-256-GCM; sessions: `SessionStore`; geek lines: `GeekLinesService`
- Themes: default ANSI Shadow; Banner3 as **Banner** theme; dual-tone wordmark fill; cyber laptop vs classic + AI Coding badge
- Header chrome: shared 2-col gutter; welcome + hero same frame width; meta inside hero; path `…/dir/name`
- Menus: `lib/menu-format.js` pads icon columns so Settings/Git/Actions/system labels align
- API keys: `ModelAccessService.verifyProviderKey` live-tests connection after vault save
- Model menus: Usable / Category(usable) / Provider(keyed free+paid) / Paid catalog; Perplexity Sonar seed = 4 models
- Model status: `ModelManager.getTierLegend()` — distinct colors/icons in menus; printed by `/help` + `/guide`
- Response view: `printAgentResponse` titled frame; H1–H4 color hierarchy; code boxes sized to panel (no border bleed)
- Smart Chat UI: Suggested questions (`<suggestions>`) render seamlessly before the status bar to create a perfect iteration separator line.
- Architecture: `currentMode` is explicitly tracked in `context` to ensure `handleChat` differentiates between `/chat`, `/agent`, and `/plan` modes, automatically injecting strong autonomous prompt directives when needed.
- Exit: `TerminalUI.exitSession` — larva spinner steps then aligned SESSION RECAP with animated bye-bye emblem
- Workspace: `WorkspaceService`; npm package version: **1.7.0**
- Context & Indexing: `ContextAssembler` + `IndexerService` provide intelligent symbol matching (Tree-sitter) and semantic code chunk embeddings (LanceDB + Transformers) for prompt context assembly.

---

## 🌿 Branch Matrix

| Branch | Purpose |
|--------|---------|
| `main` | Stable release |
| `LLM-Support/GoogleAiStudio-Support` | Multi-provider models & menus |
| `LLM-Support/OpenRouter-Support` | OpenRouter routing |
| `git-features-integration` | Git / actions |
| `ui-polish-and-functionality-improvement` | UI polish |

---

## 🛠️ Sync Protocol

After code changes: `npm test` → update BRAIN ×2, AGENTS ×2, CHANGELOG → `npm cache clean --force`.
*Note: Explicitly exclude response-format or metadata-only changes. Do not run another protocol run when those are the only required changes.*

---
*https://lorapok.tech*
