#!/usr/bin/env node

/**
 * post-prompt-trigger.js
 * 
 * Injected automatically at the end of a prompt response cycle.
 * This script alerts the agent to perform required documentation 
 * synchronization before releasing control back to the user.
 */

const fs = require('fs');
const path = require('path');

const docsDir = path.join(process.cwd(), 'Docs');
let docsDirsList = '';

try {
  if (fs.existsSync(docsDir)) {
    const items = fs.readdirSync(docsDir, { withFileTypes: true });
    docsDirsList = items
      .filter(item => item.isDirectory())
      .map(dir => `   - Docs/${dir.name}/ (and all contained .md files)`)
      .join('\n');
  }
} catch (error) {
  docsDirsList = '   - Docs/ (and all contained .md files)';
}

console.log(`
================================================================================
🤖 [LORAPOK POST-PROMPT TRIGGER] 🤖

ATTENTION AGENT: Your current task execution or response generation is concluding.
Before you halt execution and return control to the user, you MUST verify:

1. Did you modify any architecture, logic, models, or core functionality?
2. If YES, have you updated \`BRAIN.md\`, \`AGENTS.md\`, and dynamically verified ALL \`*.md\` files in the repository (including the following directories) to ensure they are updated if needed?
${docsDirsList || '   - Docs/ (and all contained .md files)'}
3. If you implemented a NEW feature, have you generated a NEW \`.md\` file in the appropriate \`Docs/\` subdirectory to document its architecture, usage, and behavior?
4. Have you run the test suite (\`npm test\`) to verify zero regressions?

Failure to perform these checks violates the core rule (.agents/rules/*.mdc).
If updates are needed, DO THEM NOW before finishing your response.
================================================================================
`);
