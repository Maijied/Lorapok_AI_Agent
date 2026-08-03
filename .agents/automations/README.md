# 🚀 Automation Drafts

Portable draft specifications for Lorapok agent automations. These are not live portal IDs, but act as guidelines for automated system behaviors.

| Draft | Purpose |
|-------|---------|
| `test-sentinel.md` | Run test suite on PR / push or after prompt completion. |
| `brain-sync.md` | Sync BRAIN docs after model or architecture changes. |
| `model-catalog-health.md` | Periodic and post-prompt catalog sanity check. |

> [!IMPORTANT]
> **Post-Prompt Trigger**: The agent must trigger these automations (via shell scripts or manual checks) immediately after its prompt response completes to ensure strict consistency.
