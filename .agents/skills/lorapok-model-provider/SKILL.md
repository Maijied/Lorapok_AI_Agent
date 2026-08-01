---
name: lorapok-model-provider
description: Skill for ModelManager, ModelValidator, ModelCacheService, multi-provider routing, menus, and REST model endpoints.
---

# Lorapok Model Provider Skill

## When to use

Changing LLM providers, catalogs, menus, `/refresh-models`, or `/api/models`.

## Checklist

1. `services/ModelManager.js` — normalize, classifyAccess, fetch, views
2. `services/ModelValidator.js` — usability + modality
3. `services/ModelCacheService.js` — failures
4. `lib/agent.js` — routing + fallback from usable set
5. `commands/settings.js` — thin UI over views
6. `server.js` — validated model endpoints
7. `Docs/providers/*` + tests
8. Never re-filter paid/usable outside the service layer
