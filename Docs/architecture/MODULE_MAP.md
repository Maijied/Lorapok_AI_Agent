> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.

# Module Map

# Module Map & Directory Structure

```mermaid
mindmap
  root((Lorapok AI Agent))
    Entrypoints
      ((CLI))
        index.js
        bin/lorapok.js
      ((API))
        server.js
    Core & Libraries
      ((lib/))
        agent.js & agent-enhanced.js
        config.js & logger.js
        ui.js & theme.js
      ((commands/))
        registry.js
        actions/, git/, chat/
    Services & Execution
      ((services/))
        Orchestrator.js
        SessionManager.js
        ModeRouter.js
        ModelManager.js & Routers
        ContextAssembler.js
        IndexerService.js
        GitManager.js
        FileManager.js
    Clients & Distribution
      ((packages/sdk/))
        HTTP client
      ((apps/website/))
        Marketing & Docs Site
    Documentation & Memory
      ((Docs/))
        architecture/
        providers/
      ((.agents/))
        rules/ & steer/
        skills/ & subagents/
      BRAIN.md & AGENTS.md
    Testing
      ((tests/))
        Jest Test Suites
```
