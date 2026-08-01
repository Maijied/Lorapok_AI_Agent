# ADR-002: Single sanitized model catalog

## Decision

`ModelManager` owns fetch → normalize → classifyAccess → categorize → cache.  
`ModelValidator` sets `available`. Menu/API views use `getUsableModelIds` / `getPaidCatalogIds` only.

## Consequences

- Google free-API models (including Pro capacity) are **usable**, not paid
- Paid = credits required (OpenRouter priced, Perplexity Pro)
