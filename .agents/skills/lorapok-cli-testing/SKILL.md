---
name: lorapok-cli-testing
description: Skill for running, testing, and debugging the Lorapok CLI, including terminal rendering, mock interactive commands, corner-case testing, and Jest test runner.
---

# Lorapok CLI Testing Skill

## Quick Start
Run full test suite:
```bash
npm test
```

Run specific test files:
```bash
npx jest tests/ui-corner-cases.test.js
npx jest tests/GitManager-corner-cases.test.js
npx jest tests/renderer-corner-cases.test.js
```

## Key Test Patterns
- **Mocking User Input**: Use `jest.mock('enquirer')` to simulate prompts without hanging terminal execution.
- **Mocking Child Processes**: Use `jest.mock('child_process')` to test Docker fallback and Git commands safely.
- **Console Capture**: Intercept stdout/stderr during test runs to verify Boxen and marked-terminal render outputs.

## Requirements
- All 155+ tests must pass cleanly.
- No unhandled promise rejections or memory leaks during test execution.
