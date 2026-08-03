#!/usr/bin/env node

/**
 * post-prompt-trigger.js
 * 
 * Injected automatically at the end of a prompt response cycle.
 * This script alerts the agent to perform required documentation 
 * synchronization before releasing control back to the user.
 */

console.log(`
================================================================================
🤖 [LORAPOK POST-PROMPT TRIGGER] 🤖

ATTENTION AGENT: Your current task execution or response generation is concluding.
Before you halt execution and return control to the user, you MUST verify:

1. Did you modify any architecture, logic, models, or core functionality?
2. If YES, have you updated \`BRAIN.md\`, \`AGENTS.md\`, and \`Docs/\`?
3. Have you run the test suite (\`npm test\`) to verify zero regressions?

Failure to perform these checks violates the core rule (.agents/rules/*.mdc).
If updates are needed, DO THEM NOW before finishing your response.
================================================================================
`);
