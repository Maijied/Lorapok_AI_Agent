# Lorapok AI Agent Context & Indexing Architecture

## Overview
Lorapok AI uses a highly efficient, multi-tiered Context and Indexing strategy to pull relevant codebase information into prompt context without exceeding token limits. This ensures that agents (`/chat`, `/analyze`, `/plan`) can operate on massive codebases gracefully.

## The Modules

1. **`IndexerService`**: 
   - Uses `tree-sitter` (AST parser) to extract class names, methods, and structural symbols into an exact-match index.
   - Uses `@xenova/transformers` and `LanceDB` (a serverless vector database) to chunk files, generate embeddings, and store them for semantic K-Nearest Neighbors (KNN) searches.
   - Leverages `chokidar` for real-time indexing of file modifications.

2. **`ContextAssembler`**:
   - The "Brain" that decides what files get injected into the LLM prompt.
   - Follows a strict token-budget (default 60,000 tokens for context).

## The 4-Tier Context Ranking Strategy

When a user asks a question, the `ContextAssembler` builds context in this priority order:

1. **Tier 1: Explicit Files** 
   - Files directly `@mentioned` or requested in the prompt.
2. **Tier 2: Plan Files**
   - If a `/plan` is active, any files marked for modification in the plan are automatically included.
3. **Tier 3: Symbol Matches**
   - The system uses regex/keyword extraction on the prompt. If it detects a known symbol (e.g., `parseInvoice()`), it finds the file defining that symbol via `tree-sitter` and includes it.
4. **Tier 4: Semantic Matches**
   - A semantic embedding of the user's prompt is generated and queried against `LanceDB`. The top structurally significant chunks are returned.

## Guidelines for AI Agents

- **Do Not Dump Large Files:** Rely on the `ContextAssembler` instead of manually reading all files unless explicitly verifying line-by-line syntax logic.
- **Trust The Context:** If you are answering a `/chat` or generating code, the most relevant chunks are likely already in your `context.assembledContext`.
- **References:** See `Docs/architecture/ADR-003-context-indexing.md` for architectural decision history.
- **Post-Prompt Trigger:** If you modify how `ContextAssembler` or `IndexerService` behaves, you MUST update this file immediately before concluding your prompt response.
