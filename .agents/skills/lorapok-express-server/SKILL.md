---
name: lorapok-express-server
description: Skill for Express REST API in server.js, model guards, sessions, and packages/sdk consumers.
---

# Lorapok Express Server Skill

## Overview

`server.js` exposes the Lorapok REST API (default port `3847`) for web and multi-client apps via `@lorapok/sdk`.

## Real endpoints

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/health` | Status + version |
| GET | `/api/models?view=usable\|paid\|all` | Validated catalog views |
| POST | `/api/models/refresh` | Bypass cache + clear failures |
| POST | `/api/chat` | Requires `message`; optional `model` (guarded) |
| POST | `/api/generate` | Code generation |
| POST | `/api/analyze` | Analyze code |
| POST | `/api/debug` | Debug code |
| GET | `/api/files`, `/api/files/tree`, `/api/files/read` | Workspace |
| POST | `/api/files/generate` | Generate into file |
| GET/POST | `/api/git/*` | Git status/branches/log/commit |
| POST | `/agent/single`, `/agent/multi` | Agent runs |
| GET/PUT | `/api/settings` | Settings; PUT model guarded |
| DELETE | `/api/sessions/:sessionId` | Session cleanup |

## Rules

- Never serve models via raw `getAllKnownModels()` alone
- Use `canSelectModel` before accepting client model IDs
- Log with `lib/logger`; CORS via `CORS_ORIGIN`
- Document contracts in `Docs/api/REST.md` and `Docs/api/MODELS.md`
- Add/adjust tests in `tests/api.test.js`

## Adding an endpoint

1. Validate body/query → call agent/service → JSON response  
2. Prefer `asyncHandler` + `sendError`  
3. Update Docs + express skill + api tests  
