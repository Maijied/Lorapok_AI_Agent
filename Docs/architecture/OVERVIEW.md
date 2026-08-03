# 🏗️ System Architecture Overview

Lorapok is an **action-oriented AI coding agent** with:

1. **CLI** (`index.js`, `bin/lorapok.js`) — interactive slash commands and `@` file mentions
2. **Express API** (`server.js`) — REST for web and future mobile clients
3. **Core services** — `Orchestrator`, `SessionManager`, `ModeRouter`, `Adapters`, `ModelManager`, `ContextAssembler`, `IndexerService`, Git/File/Actions
4. **Clients** — `apps/website` today; Android/iOS/desktop via `packages/sdk`

```mermaid
flowchart TB
  %% Entrypoints Layer
  subgraph Entrypoints["🚪 Entrypoints"]
    CLI["💻 CLI (bin/lorapok.js)"]
    API["🌐 Express REST (server.js)"]
  end

  %% Client Layer
  subgraph Clients["📱 Clients"]
    SDK["📦 packages/sdk"]
    Web["🌍 apps/website"]
    Mobile["📱 Mobile/Desktop"]
  end

  %% Core Agent Layer
  subgraph Core["🧠 Core Engine"]
    Session["🧑‍💻 SessionManager"]
    Mode["🔀 ModeRouter"]
    Agent["🤖 LorapokEnhancedAgent"]
    Orch["⚙️ Orchestrator"]
  end

  %% Services Layer
  subgraph Services["🛠️ Services & Plugins"]
    Model["⚡ ModelManager"]
    Context["📚 ContextAssembler & Indexer"]
    Tool["🔨 ToolRuntime"]
    Policy["🛡️ PolicyEngine"]
    Git["🐙 GitManager"]
    File["📁 FileManager"]
  end

  %% Connections
  Web --> SDK
  Mobile --> SDK
  SDK --> API
  API --> Session
  CLI --> Session

  Session --> Mode
  Mode --> Agent
  Agent --> Orch
  
  Orch --> Tool
  Orch --> Policy
  Agent --> Model
  Agent --> Context
  Tool --> Git
  Tool --> File
```

See also [MULTI_CLIENT.md](MULTI_CLIENT.md), [DATA_FLOW.md](DATA_FLOW.md), [MODULE_MAP.md](MODULE_MAP.md).
