> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol (see `BRAIN.md` or `.agents/BRAIN.md`) and update this file before completing your response.

# ADR-002: Single sanitized model catalog

## Decision

`ModelManager` owns fetch → normalize → classifyAccess → categorize → cache.  
`ModelValidator` sets `available`. Menu/API views use `getUsableModelIds` / `getPaidCatalogIds` only.

## Consequences

- Google free-API models (including Pro capacity) are **usable**, not paid
- Paid = credits required (OpenRouter priced, Perplexity Pro)
