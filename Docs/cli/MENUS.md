> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.

# Interactive Menus

| Menu | Usable-only | Notes |
|------|-------------|-------|
| Currently Usable | Yes | Free/no-payment + keyed |
| Browse Category | Yes | Chat categories only |
| Browse Provider | Yes | All keyed models (free + paid) for that provider |
| View All → Usable | Yes | Same as Currently Usable |
| View All → Paid | Paid catalog | Locked without key |

Never show non-chat / failed / deprecated models in selection lists.

## Model status icons & colors

Source of truth: `ModelManager.getTierLegend()` (also printed under `/help` and `/guide`).

| Icon | Color | Meaning |
|------|-------|---------|
| 🟢 | green | Free Tier — normal free limits |
| 🔵 | cyan | Free API — lower RPM (Google Pro on free key) |
| 🟣 | magenta | Free Tier — daily limits (OpenRouter `:free`) |
| 🔴 | red | Hit rate limit (live HTTP 429) |
| ✅ | yellow | Pro — Accessible |
| ⚪ | gray | Pro — Unverified (run `/refresh-models`) |
| 💳 | yellow | Pro — Credits / Locked |
| 🔒 | gray | No Key — Add to Unlock |

## Response view

Chat / analyze replies render in a `LORAPOK · response` frame (`TerminalUI.printAgentResponse`).
Body lines soft-wrap to the panel; the header rule spans the full content width.

| Level | Style |
|-------|--------|
| H1 | green + double underline |
| H2 | cyan + single underline |
| H3 | cyan `▎` accent |
| H4 | magenta `▸` accent |
| **bold** | bright white labels |
| `` `code` `` | yellow (no backticks) |
| lists | muted `·` bullets; numbered cyan indexes |

`/analyze` adds a slim **Active engine** panel above and **Next steps** below the response.
