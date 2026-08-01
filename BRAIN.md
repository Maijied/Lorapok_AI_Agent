# 🧠 Lorapok AI Agent - Central System Brain (BRAIN.md)

> **LIVING SYSTEM MEMORY & KNOWLEDGE BASE**  
> *Last Synced: 2026-08-01 | Version: 1.3.2 | Test Suite: 23/23 Passed (270 Tests)*

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
├── lib/               # agent, config, ui, cache
├── services/          # Model*, Git, File, Actions
├── server.js
├── packages/sdk/      # HTTP client stub
├── apps/website/      # marketing site
├── Docs/              # architecture, api, cli, providers
├── .agents/           # skills, steer, rules, hooks, automations
└── tests/             # Jest (23 suites / 270 tests)
```

See [Docs/architecture/MODULE_MAP.md](Docs/architecture/MODULE_MAP.md).

---

## 📊 Live Metrics

- Node.js >= 18
- Jest: **23 suites, 270 tests passing**
- npm package version: **1.3.2**

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

---
*https://lorapok.tech*
