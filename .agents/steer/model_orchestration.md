# Model Orchestration Steer

- Dynamic sanitize pipeline: `ModelSanitizeService` (discover → normalize → modality → classify → probe → views)
- No static catalog as source of truth when provider APIs succeed (`DEFAULT_*` = offline emergency / unverified seed only)
- Usable vs Paid invariants (Google free-API = usable; paid selectable only when live-accessible)
- Provider browse = all keyed models for that provider (free + paid); Perplexity seed = 4 Sonar IDs
- Category browse = usable ∩ domain
- Labels: `(Pro — Accessible)` vs `(Pro — Credits Required / Locked)`
- Probe floor: `max_tokens >= 16` (Perplexity rejects 1)
- Fallback via scored `buildFallbackRank` / `pickFallbackModelId`; multi-retry; persist model only after success
- CLI menus and REST share the same views; `/refresh-models` runs full sanitize
- Default CLI theme: **Lorapok** (Labs Bible neon green/cyan)
