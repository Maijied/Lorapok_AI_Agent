# ADR-004: Security Hardening & CI Stability for Indexing and Context Assembly

## Context
With the introduction of LanceDB for semantic search and Tree-sitter for AST parsing, new vectors for path traversal and arbitrary repository context injection were introduced. Additionally, cross-platform CI pipelines frequently failed due to Tree-sitter Node-API ABI mismatches when resolving `tree-sitter-typescript` on different environments.

## Decisions

### 1. Security: Path Traversal Protection
We enforced strict path normalization in `ContextAssembler.js`. Absolute paths pointing outside the workspace and relative paths attempting directory traversal (`../`) are explicitly blocked during explicit file inclusion and plan parsing.

### 2. Security: Prompt Isolation
System prompts in `lib/agent.js` and `lib/agent-enhanced.js` are separated from dynamic user workspace content. Repository context is now placed in a normal user message using `[UNTRUSTED REPOSITORY CONTEXT START]` and `[UNTRUSTED REPOSITORY CONTEXT END]` prompt-handling markers to prevent prompt injection attacks that could trick the agent into misinterpreting its directives, rather than a hard sandbox.

### 3. Stability: Tree-Sitter Parser Consolidation
Due to ABI mismatches between `tree-sitter` v0.25 and `tree-sitter-typescript` v0.23 resulting in segmentation faults on macOS/Windows CI runners, we removed `tree-sitter-typescript`. TypeScript and TSX files now fallback to the `tree-sitter-javascript` (v0.25) parser. This provides sufficient structural AST extraction (classes, methods, functions) for our semantic chunking without causing native binary link failures.

### 4. Reliability: Bounded LanceDB Retries
The `IndexerService.js` initialization logic tracks `this.initFailed` to immediately fail subsequent initialization requests if the initial LanceDB or Transformer connection fails. This prevents unbounded retry loops that would stall the orchestrator.

## Consequences
- **Positive:** Improved security posture against path traversal.
- **Positive:** Cross-platform native binary compilation and CI test suites are fully stable.
- **Negative:** TypeScript interfaces and type aliases are not natively extracted into the symbol index, as the fallback JavaScript parser ignores them.

> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.
