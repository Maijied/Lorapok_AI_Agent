# Lorapok Agent Hooks

Configured in [`.agents/hooks.json`](../hooks.json).

| Script | Event | Behavior |
|--------|-------|----------|
| `session-start.js` | sessionStart | Prints grounding paths |
| `before-shell.js` | beforeShellExecution | Warns on destructive git |
| `after-file-edit.js` | afterFileEdit | Reminds npm test / Docs sync |

Agents operating in this repo should load and respect these hooks.
