# Model & Chat Data Flow

```mermaid
flowchart TD
  APIs[Google + OpenRouter APIs] --> Norm[normalizeApiModel]
  Norm --> Access[classifyAccess + categorize]
  Access --> Cache[Unified catalog cache]
  Cache --> Val[ModelValidator available flags]
  Val --> Views[usable / paid / category / provider]
  Views --> CLI[settings menus]
  Views --> REST[GET /api/models]
  Fail[failedModels] --> Val
  Fail --> FB[pickFallbackModelId]
```

**Rules**

- Currently Usable / Category / Provider = no payment required + key + not failed
- Paid Catalog = payment required only (reference; selectable if keyed)
- Google AI Studio models with free API keys are **usable**, not paid
