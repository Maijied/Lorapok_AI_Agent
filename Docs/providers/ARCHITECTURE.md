> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.

# Provider Integration Architecture

See [Docs/architecture/DATA_FLOW.md](../architecture/DATA_FLOW.md).

## Dynamic sanitize pipeline

`ModelSanitizeService` orchestrates:

1. **Discover** — live list APIs (Google / OpenRouter); Perplexity seed + probe
2. **Normalize / modality / classify** — `ModelManager` + `ModelValidator`
3. **Probe** — `ModelAccessService` mini-chat (`max_tokens: 16`; Perplexity floor)
4. **Views** — usable / paid / selectable; scored fallback rank

Selectable models require live `accessible` or `rate_limited` access (not key presence alone).

Implement new providers via [ADDING_A_PROVIDER.md](ADDING_A_PROVIDER.md).
