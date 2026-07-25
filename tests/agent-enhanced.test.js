/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
const { LorapokEnhancedAgent } = require('../lib/agent-enhanced');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('LorapokEnhancedAgent', () => {
    let agent;
    let testRoot;

    beforeEach(() => {
        testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lorapok-enhanced-test-'));
        agent = new LorapokEnhancedAgent('fake-key', testRoot);
    });

    afterEach(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('should parse CREATE FILE action', () => {
        const content = 'ACTION: CREATE FILE: test.js\n```javascript\nconsole.log(1);\n```';
        const actions = agent.parseActions(content);
        expect(actions.length).toBe(1);
        expect(actions[0].type).toBe('CREATE');
        expect(actions[0].filePath).toBe('test.js');
        expect(actions[0].content).toBe('console.log(1);');
    });

    test('should parse RUN COMMAND action', () => {
        const content = 'ACTION: RUN COMMAND: install deps\n```bash\nnpm install\n```';
        const actions = agent.parseActions(content);
        expect(actions.length).toBe(1);
        expect(actions[0].type).toBe('COMMAND');
        expect(actions[0].description).toBe('install deps');
        expect(actions[0].content).toBe('npm install');
    });

    test('should parse DELETE FILE action', () => {
        const content = 'ACTION: DELETE FILE: garbage.tmp';
        const actions = agent.parseActions(content);
        expect(actions.length).toBe(1);
        expect(actions[0].type).toBe('DELETE');
        expect(actions[0].filePath).toBe('garbage.tmp');
    });

    test('should detect languages from file extensions', () => {
        expect(agent.detectLanguage('file.js')).toBe('javascript');
        expect(agent.detectLanguage('file.py')).toBe('python');
        expect(agent.detectLanguage('Dockerfile')).toBe('dockerfile');
        expect(agent.detectLanguage('script.pl')).toBe('perl');
        expect(agent.detectLanguage('logic.pro')).toBe('prolog');
    });

    test('should NOT be greedy with code blocks (ignore examples after action)', () => {
        const content = `
ACTION: RUN COMMAND: test
\`\`\`bash
actual-command
\`\`\`

Expected output:
\`\`\`
example-output-to-ignore
\`\`\`
        `;
        const actions = agent.parseActions(content);
        expect(actions.length).toBe(1);
        expect(actions[0].content).toBe('actual-command'); // Should NOT be 'example-output-to-ignore'
    });
});
