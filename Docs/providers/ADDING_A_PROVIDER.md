# Adding a Provider

1. Config getters/setters in `lib/config.js`
2. `normalizeApiModel` + fetch in `ModelManager`
3. Routing in `lib/agent.js` (`validateApiKey`, base URL)
4. `ModelValidator.isModelUsable` key gate
5. CLI settings key menu + registry docs
6. REST: ensure `/api/models` validation includes new keys
7. Tests + BRAIN + Docs/providers guide
8. Update `.agents/skills/lorapok-model-provider`
