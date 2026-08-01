# REST API Reference

Base URL default: `http://localhost:3847` (`PORT` env).

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health + version |
| GET | `/api/models?view=usable\|paid\|all` | Validated model views |
| POST | `/api/models/refresh` | Refresh catalog |
| POST | `/api/chat` | Chat (`message`, optional `model`, `sessionId`) |
| POST | `/api/generate` | Code generation |
| POST | `/api/analyze` | Analyze code |
| POST | `/api/debug` | Debug code |
| GET | `/api/files`, `/api/files/tree`, `/api/files/read` | Workspace files |
| GET/POST | `/api/git/*` | Git operations |
| POST | `/agent/single`, `/agent/multi` | Agent runs |
| GET/PUT | `/api/settings` | Settings (model guarded on PUT) |
| DELETE | `/api/sessions/:id` | Clear session |

CORS: set `CORS_ORIGIN` (comma-separated) for restricted origins.
