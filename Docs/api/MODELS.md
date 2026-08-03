> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.

# Models API Contract

## GET /api/models

Query:

- `view=usable` (default) — selectable no-payment models
- `view=paid` — payment-required catalog
- `view=all` — `{ usable, paid, counts }`

Each model includes: `id`, `name`, `provider`, `category`, `contextLength`, `rateLimit`, `resetWindow`, `available`, `paymentRequired`, `rateLimited`, `tier`, `description`.

## Guards

`POST /api/chat` and `PUT /api/settings` reject inaccessible model IDs with `400` / `MODEL_NOT_ACCESSIBLE`.
