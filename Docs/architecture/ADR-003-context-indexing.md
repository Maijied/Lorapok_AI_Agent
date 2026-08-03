# ADR 003: Context Assembly & Semantic Indexing

## Status
Accepted

## Context
As Lorapok grows to support larger workspaces and more complex autonomous agent modes (`/plan`, `/analyze`, `/chat`), the default strategy of appending all workspace files to the prompt context has hit critical scaling limits. It wastes tokens, increases latency, and causes LLMs to lose focus on the actual objective due to context bloat.

We need a targeted approach to extract only the most relevant files and symbols based on the user's specific prompt.

## Decision
We decided to implement a dual-strategy (Exact Symbol + Semantic Vector) indexing system integrated with a unified Context Assembler.

1. **`tree-sitter` for Exact Symbol Matching**
   - **Why:** To deterministically find definitions for specific functions, classes, and variables mentioned in the prompt (e.g. `parseInvoice()`).
   - **How:** Using the AST, we map symbols to their defining file paths and line ranges.

2. **`LanceDB` + `@xenova/transformers` for Semantic Search**
   - **Why:** To handle abstract, conceptual queries (e.g., "Where is the retry logic?").
   - **How:** Files are chunked and converted into vector embeddings locally (using `Xenova/all-MiniLM-L6-v2`) and stored in LanceDB. KNN search retrieves top relevant chunks.

3. **`ContextAssembler` for Tiered Ranking**
   - Acts as the gateway between the filesystem and the LLM. 
   - Assigns priority: Explicit Files > Plan Files > Symbol Matches > Semantic Matches.
   - Enforces strict token budgets.

## Consequences

### Positive
- **Reduced Token Usage:** Agents only see the code they need.
- **Improved Accuracy:** Reduced context bloat leads to higher LLM instruction adherence.
- **Performance:** LanceDB's serverless vector search is highly performant.

### Negative / Mitigation
- **Dependencies:** Both `LanceDB` and `tree-sitter` use native C++ bindings which can cause issues across different OS environments (e.g. CI vs Local). 
- **Mitigation:** We have wrapped these modules in lazy loads/try-catches, allowing the system to gracefully degrade to standard file loading if the indexing engines fail to initialize. Tests have been mocked appropriately.
