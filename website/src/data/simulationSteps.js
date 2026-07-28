export const simulationScenarios = [
  {
    id: 'refactor',
    label: 'Refactor Code',
    badge: 'Code Quality',
    icon: '⚡',
    prompt: 'Refactor utils.js to extract string parsing helpers and add JSDoc',
    steps: [
      { text: '$ lorapok --task "Refactor utils.js"', type: 'command', delay: 400 },
      { text: '🐛 Lorapok AI v1.2.0 — Autonomous Agentic Engine', type: 'system', delay: 200 },
      { text: '✨ Connected to Google Gemini 3.6 Flash [Free Tier]', type: 'info', delay: 300 },
      { text: '🔍 Scanning workspace structure...', type: 'info', delay: 500 },
      { text: '📂 Found 14 files across 4 services', type: 'dim', delay: 300 },
      { text: '🧠 Generating execution plan...', type: 'plan-head', delay: 600 },
      { text: '   1. Parse `lib/utils.js` (Lines 1-120)', type: 'plan-item', delay: 200 },
      { text: '   2. Extract `sanitizePath()` & `formatBytes()` to `lib/helpers.js`', type: 'plan-item', delay: 200 },
      { text: '   3. Add comprehensive JSDoc annotations', type: 'plan-item', delay: 200 },
      { text: '⚡ Step 1/3: Reading target module...', type: 'action', delay: 400 },
      { text: '📝 Step 2/3: Applying chunked file edit [lib/helpers.js]...', type: 'action', delay: 600 },
      {
        text: `+ export function sanitizePath(input) {\n+   return input.replace(/[^a-zA-Z0-9_/.-]/g, '');\n+ }`,
        type: 'diff-add',
        delay: 500
      },
      { text: '✅ Modified lib/utils.js (-24 lines, +8 lines)', type: 'success', delay: 400 },
      { text: '🧪 Running verification test suite...', type: 'info', delay: 700 },
      { text: '   PASS tests/utils.test.js (12 passed, 0 failed)', type: 'success', delay: 400 },
      { text: '🔗 Creating git commit: "refactor: extract string parsing helpers"', type: 'action', delay: 500 },
      { text: '🎉 Execution complete in 3.4s! Zero errors.', type: 'success-bold', delay: 300 }
    ]
  },
  {
    id: 'tests',
    label: 'Generate Tests',
    badge: '100% Coverage',
    icon: '🧪',
    prompt: 'Generate unit tests for ModelValidator service',
    steps: [
      { text: '$ lorapok "Generate unit tests for ModelValidator.js"', type: 'command', delay: 400 },
      { text: '🐛 Lorapok AI v1.2.0 — Autonomous Agentic Engine', type: 'system', delay: 200 },
      { text: '🔍 Inspecting services/ModelValidator.js...', type: 'info', delay: 400 },
      { text: '📊 Analyzing edge cases: quota exceeded, empty responses, invalid models', type: 'dim', delay: 400 },
      { text: '🧠 Plan: Create `tests/ModelValidator.test.js` with 8 test cases', type: 'plan-head', delay: 500 },
      { text: '📝 Writing test suite file [tests/ModelValidator.test.js]...', type: 'action', delay: 700 },
      {
        text: `+ describe('ModelValidator', () => {\n+   it('filters out zero-quota models', () => {\n+     expect(ModelValidator.isValid('gemini-1.0')).toBe(false);\n+   });\n+ });`,
        type: 'diff-add',
        delay: 600
      },
      { text: '🧪 Executing Jest test runner...', type: 'info', delay: 800 },
      { text: '   PASS tests/ModelValidator.test.js (8 passed, 8 total)', type: 'success', delay: 500 },
      { text: '📈 Test coverage increased to 100%', type: 'success', delay: 300 },
      { text: '🔗 Git commit: "test: add ModelValidator unit test suite"', type: 'action', delay: 400 },
      { text: '🎉 Task complete in 2.8s!', type: 'success-bold', delay: 300 }
    ]
  },
  {
    id: 'fix',
    label: 'Fix Bug & Deploy',
    badge: 'Auto Repair',
    icon: '🛡️',
    prompt: 'Diagnose and fix token limit handling error',
    steps: [
      { text: '$ lorapok "Fix token overflow crash in agent-enhanced.js"', type: 'command', delay: 400 },
      { text: '🐛 Lorapok AI v1.2.0 — Autonomous Agentic Engine', type: 'system', delay: 200 },
      { text: '🔍 Reading error traceback logs...', type: 'info', delay: 500 },
      { text: '⚠️ Identified root cause: unhandled TokenOverflowException on line 142', type: 'warning', delay: 500 },
      { text: '🧠 Strategy: Add dynamic context truncation fallback', type: 'plan-head', delay: 500 },
      { text: '📝 Patching lib/agent-enhanced.js...', type: 'action', delay: 600 },
      {
        text: `- if (tokens > MAX) throw new TokenOverflowError();\n+ if (tokens > MAX) return this.truncateContext(history);`,
        type: 'diff-mod',
        delay: 600
      },
      { text: '🧪 Verifying patch with 186 unit tests...', type: 'info', delay: 900 },
      { text: '   PASS 21/21 Test Suites (186 passed, 0 failed)', type: 'success', delay: 600 },
      { text: '🚀 Triggering GitHub Actions CI/CD deployment...', type: 'action', delay: 500 },
      { text: '🎉 Bug resolved & committed in 4.1s!', type: 'success-bold', delay: 300 }
    ]
  }
];
