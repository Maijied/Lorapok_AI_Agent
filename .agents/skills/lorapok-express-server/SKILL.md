---
name: lorapok-express-server
description: Skill for API endpoints, Express web server, streaming responses, and auth security management in server.js and lib/agent-enhanced.js.
---

# Lorapok Express Server Skill

## Overview
`server.js` provides an Express REST API backend for web interface clients and remote agent execution.

## Endpoints
- `POST /api/chat`: Submit user query to Lorapok Agent.
- `GET /api/status`: Health check and system info.
- `POST /api/actions/execute`: Run specific agent actions.
- `GET /api/history`: Retrieve agent chat session history.

## Development Rules
- Use `cors()` middleware with safe origin settings.
- Implement request payload validation and file upload boundaries (`multer`).
- Ensure graceful shutdown (`SIGTERM`/`SIGINT` handling).
