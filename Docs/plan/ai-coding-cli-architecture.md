> [!IMPORTANT]
> **Post-Prompt Trigger (MANDATORY)**: If you modify the codebase in a way that affects this document, you must automatically execute the Sync Protocol and update this file before completing your response.

# Multi-Provider AI Coding CLI — Production Architecture

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLI Shell / REPL                          │
│   arg parser · interactive prompt · streaming renderer · signals  │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
┌───────────────────────────────▼────────────────────────────────────┐
│                        Session Manager                             │
│  mode state · history · working-set files · budget/cost tracker    │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
┌───────────────────────────────▼────────────────────────────────────┐
│                          Mode Router                               │
│      chat  │  plan  │  agentic  │  analysis/debug                  │
└───────────────────────────────┬────────────────────────────────────┘
                                 │
┌───────────────────────────────▼────────────────────────────────────┐
│                          Orchestrator                               │
│  task decomposer · thinking-step controller · tool dispatcher       │
└───────┬─────────────────┬─────────────────┬─────────────────┬──────┘
        │                 │                 │                 │
┌───────▼──────┐  ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼──────┐
│ Model Router  │  │ Tool Runtime  │ │ Context Store │ │ Environment  │
│ (text/image/  │  │ (fs/shell/git/│ │ (symbol +     │ │ Manager      │
│  audio, auto  │  │  test/search) │ │  embedding     │ │ (dep detect  │
│  vs manual)   │  │               │ │  index)        │ │  & install)  │
└───────┬───────┘  └───────────────┘ └───────────────┘ └──────────────┘
        │
┌───────▼──────────────────────────────────────────────────────────┐
│                    Provider Adapter Layer                         │
│  Claude · GPT · Gemini · Perplexity · local models · image/audio  │
└─────────────────────────────────────────────────────────────────┘
```

Everything above the Provider Adapter Layer is provider-agnostic. Everything below it never leaks provider-specific shapes upward.

---

## 2. Model Registry & Selection Engine

### 2.1 Registry schema

Every model, regardless of modality, registers a capability profile:

```typescript
interface ModelProfile {
  id: string;                     // "claude-sonnet-5", "gpt-image-1", "whisper-large-v3"
  provider: string;
  modality: "text" | "image" | "audio" | "multimodal";
  strengths: TaskTag[];            // ["code_gen","long_context","tool_use","reasoning"]
  contextWindow: number;
  costPerMTokIn: number;
  costPerMTokOut: number;
  latencyClass: "fast" | "standard" | "slow";
  toolUseSupport: boolean;
  maxOutputTokens: number;
  availability: "online" | "degraded" | "down";  // updated by health checks
}
```

This registry is the single source of truth. Health-check pings run on an interval (e.g. every 60s, backoff on failure) and flip `availability`, feeding directly into routing decisions — a model marked `down` is never selected even if it's the "best" match.

### 2.2 Selection modes

**Manual mode**: user pins a model per task or globally (`--model=claude-sonnet-5`). Router does zero decisioning — just validates the pin is still `online`, else prompts to fall back.

**Auto mode (default)**: router scores every `online` candidate for the task:

```
score = w1*capability_match + w2*(1/cost) + w3*(1/latency) + w4*context_fit - penalty(recent_failures)
```

- `capability_match`: does the task tag (code_gen, debugging, web_grounding, image_gen, transcription) intersect the model's `strengths`?
- `context_fit`: does the assembled context + expected output fit under `contextWindow`? Hard disqualifier if not.
- `penalty`: exponential backoff weight if this model failed/errored in the last N calls this session — prevents hammering a flaky provider.

**On-demand mode** (the "Claude CLI" behavior the request references): the orchestrator doesn't pre-decide a model for the whole task — each *sub-step* independently asks the router "what do I need right now?" A single agentic run might use Perplexity for one search sub-step, Claude for the code edit, and a fast/cheap model for a trivial "is this test output pass or fail" classification — all within one user-facing task, invisible to the user unless they ask for a trace.

### 2.3 Modality routing

```
Task arrives → Task Classifier → modality tag(s)
    text-only        → text model router
    "generate/edit an image" → image model router (DALL-E/Imagen/etc.)
    "transcribe/analyze audio" → audio model router (Whisper-class)
    mixed (e.g. "look at this screenshot and fix the bug") → multimodal-capable text model first choice; falls back to OCR/vision tool + text model if none available
```

**Corner cases:**
- Task needs image generation but no image model configured → surface a clear capability gap, don't silently skip
- Multimodal input (screenshot) but selected text model lacks vision → router auto-escalates to a vision-capable model even if it scored lower on cost, since correctness > cost here
- Provider rate-limited mid-task → router picks next-best `online` candidate mid-flight, translates conversation history via the adapter layer, and logs the switch for the trace
- All candidates for a required modality are `down` → orchestrator pauses the task and reports specifically which capability is unavailable, rather than a generic error

---

## 3. Tool & Dependency Auto-Installation

This is one of the higher-risk subsystems, so it's isolated as its own component with its own permission tier (see §5.2).

### 3.1 Detection flow

```
Tool Runtime needs to run a command
    │
    ▼
Is binary/package already resolvable? (which/where, import check, composer show)
    │no
    ▼
Environment Manager: identify ecosystem
    (package.json → npm/yarn/pnpm, requirements.txt/pyproject.toml → pip/poetry,
     composer.json → composer, Cargo.toml → cargo, go.mod → go)
    │
    ▼
Resolve exact package + version needed (from error message, import statement, or task spec)
    │
    ▼
Policy check (allowlist / confirm / deny — same state machine as agentic tool calls)
    │
    ▼
Install in an isolated, reversible way:
    - JS: install to project-local node_modules via detected package manager, never global
    - Python: install into project venv (create one if absent), never system Python
    - Never `sudo`, never modify system PATH permanently
    │
    ▼
Verify install succeeded (re-run resolution check) → record in a manifest for this session
```

### 3.2 Manifest & rollback

Every auto-install is appended to a session manifest (`.cli-installs.json` in the repo, gitignored by default):

```json
{ "installs": [
  { "ecosystem": "npm", "package": "lodash", "version": "^4.17.21", "installedAt": "...", "reason": "used in step 4 of plan #12" }
]}
```

This gives the user a single command to undo everything the CLI installed in a session (`cli --undo-installs`), and gives the orchestrator a record to check before reinstalling something already present.

### 3.3 Corner cases

- **Conflicting version already installed**: never force-upgrade silently — confirm with user, since it can break other code
- **No package manager detected** (bare directory, no manifest file): ask once whether to initialize one (`npm init -y`, `python -m venv .venv`) rather than guessing
- **Network egress blocked** (offline environment): fail fast with a specific message naming the missing package, don't retry indefinitely
- **Package name ambiguity** (import `cv2` → package is `opencv-python`, not `cv2`): maintain a small mapping table of well-known import→package mismatches, fall back to a registry search if unmapped
- **Monorepo with multiple manifests**: install into the correct sub-package's manifest, determined by which file triggered the need, not the repo root
- **Global tool needed** (a CLI binary like `ffmpeg`, not a library): check system package manager (apt/brew) presence first, and *always* confirm before touching system-level installs — this is a "confirm" tier minimum, never auto-approved even in a permissive config

---

## 4. Thinking-Step Architecture

Every mode routes through a common "thinking controller" before any output or tool call, so reasoning quality doesn't depend on which provider is active.

```
Task → Thinking Controller
    │
    ├─ Step 1: Restate goal + constraints (catches misunderstood requests early)
    ├─ Step 2: Decompose into sub-tasks (skipped for trivial chat turns)
    ├─ Step 3: For each sub-task — identify required modality/tool/model
    ├─ Step 4: Identify unknowns → trigger context retrieval or clarifying question
    ├─ Step 5: Draft approach → self-check against constraints (budget, permissions, repo state)
    └─ Step 6: Emit either: an answer (chat), a plan (plan mode), or the first tool call (agentic)
```

**Depth scales with mode**: chat mode mostly skips steps 2–5 for simple turns; agentic mode always runs the full sequence per sub-task, re-entering step 4 whenever a tool result reveals something unexpected (e.g. a test fails in a way the plan didn't anticipate).

**Corner cases:**
- Thinking step itself picks a model — for complex planning, route to a strong-reasoning model even if a cheaper one would execute the resulting steps
- Circular reasoning guard: if step 5's self-check fails twice in a row for the same sub-task, escalate to the user instead of looping
- Thinking output is never shown raw to the user by default (avoids noise) but is always logged to the session trace, retrievable via `--verbose` or `--trace`

---

## 5. Mode Architectures — Full Step-by-Step

### 5.1 Chat Mode

```
User input → Session context assembly (recent turns + explicitly referenced files)
    → Thinking (lightweight) → Model Router (text, auto/manual) → Provider call
    → Stream response (intercept & extract <suggestions> tags silently) 
    → Append to history → Trim history if over budget
    → Display Response + Render "Suggested Next Questions"
    → REPL (Supports standard manual text input or quick numeric selection [1-3] of suggestions)
```
Corner cases: mid-chat file reference triggers a one-off context-store lookup without switching modes; provider swap mid-conversation re-serializes history through the new adapter; runaway user paste (huge blob) triggers a size guard offering to index it instead of inlining. Suggested follow-ups are context-aware and generated in the same pass as the response to avoid latency penalties.

### 5.2 Plan Mode

```
User goal → Thinking (full decomposition) → Context Assembler pulls relevant files/symbols
    → Planner model drafts steps → Each step's edit dry-run generates a diffPreview
    → Dependency/tool needs identified per step (flagged, not installed yet — plan mode never installs)
    → Plan object emitted with risk rating → Presented to user for review/approval
    → On approval: plan handed to Agentic Mode as its execution input
```
Corner cases: covered in the prior turn (staleness hashing, circular deps, uncommitted-changes block) — plan mode additionally now flags "this step will require installing X" as a review item, so installs are never a surprise once execution starts.

### 5.3 Agentic Mode

```
Receives plan (or an ad-hoc goal if run standalone)
    → Pre-flight: git checkpoint (stash/shadow branch)
    → For each step:
        Thinking → identify tool/model needed
        → If dependency missing: Environment Manager auto-install flow (§3), policy-gated
        → Policy check on the action itself (read/allowlist/confirm/deny, §prior turn)
        → Execute tool call → capture result
        → Thinking re-entry: did result match expectation?
            yes → advance to next step
            no  → replan this step only (bounded retries) or escalate to user
    → Loop guards: max tool calls, repeated-failure detector, cost budget checkpoint
    → On completion or interrupt: finalize diff summary, offer commit, keep checkpoint for revert
```
Corner cases (superset of earlier answer): a step needs an image/audio model mid-run (e.g. "generate a placeholder icon") — routed through modality router same as any sub-task, output file written through the same diff/checkpoint discipline as code edits; SIGINT lets in-flight tool call finish before halting; a step's auto-install fails — mode pauses that step, keeps prior successful steps intact, reports precisely what's blocked.

### 5.4 Analysis / Debugging Mode

```
Input: error/log/failing-test/stack-trace (or user description)
    → Thinking: classify — flaky vs deterministic, single-file vs cross-file
    → Context Assembler: pull only relevant frames/files (never whole repo blind)
    → Model Router: prefer strong-reasoning model for root-cause step
    → Reproduce: run failing test/command via Tool Runtime (read-only tier)
    → If flaky suspected: re-run N times before concluding
    → Root cause hypothesis → propose fix as a mini-plan (reuses Plan Mode's diff format)
    → Hand off to Agentic Mode for execution if user approves
```
Corner cases: multi-file root cause builds a minimal reproducible slice rather than dumping full context; missing test framework triggers the same auto-install flow (confirm-gated) before the reproduce step can run; environment-specific bug (works locally, fails in CI) flagged explicitly rather than "fixed" blindly.

---

## 6. Full Execution Lifecycle (End-to-End)

```
1. CLI launch → load project config (.cli/config.json: allowlists, model prefs, provider keys)
2. Environment scan → detect ecosystems, existing installs, git state
3. Context Store init/incremental update (§context architecture, prior turn)
4. User enters a prompt → Mode Router determines mode (explicit flag or inferred from phrasing)
5. Session Manager assembles working context within budget
6. Thinking Controller runs
7. Model Router selects provider(s) per sub-task (auto/manual/on-demand)
8. Mode-specific flow executes (§5)
9. Tool Runtime + Environment Manager handle any execution/install needs, policy-gated throughout
10. Results streamed to user; diffs/checkpoints recorded
11. Session state persisted (history, manifest, plan objects) for resume across CLI restarts
12. On exit: summarize session (files changed, installs made, cost/tokens used)
```

---

## 7. Production-Grade Concerns

- **Security**: never auto-approve writes outside the repo root, hard-denylist credential files, sandbox shell exec (no unrestricted network from tool calls), all provider API keys loaded from OS keychain/env, never logged.
- **Observability**: structured trace log per session (every model call, tool call, cost, latency) — this is what makes multi-provider debugging tractable and is the biggest practical edge over a single-provider CLI.
- **Cost control**: per-session and per-project budget caps, live cost display, auto-downgrade suggestion (not silent switch) when approaching budget.
- **Extensibility**: new provider = one adapter file; new tool = one Tool Runtime plugin implementing a fixed `{name, schema, execute, policyTier}` interface — no core orchestrator changes needed.
- **Resilience**: every external call (model, install, tool exec) wrapped with timeout + retry-with-backoff + circuit breaker per provider, so one flaky dependency degrades gracefully instead of hanging the whole CLI.
- **What actually beats single-provider tools**: capability-based routing across modalities + providers, explicit cost/latency tradeoff visibility, and a shared checkpoint/diff discipline that makes agentic mode safely reversible regardless of which model proposed the change.
