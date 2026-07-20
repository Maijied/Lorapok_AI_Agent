const { LorapokEnhancedAgent } = require('../lib/agent-enhanced');
const path = require('path');

describe('LorapokEnhancedAgent Action Parsing', () => {
    let agent;

    beforeEach(() => {
        agent = new LorapokEnhancedAgent('fake-key', '/tmp/lorapok-test');
    });

    test('should parse CREATE FILE action', () => {
        const content = `
ACTION: CREATE FILE: src/index.js
\`\`\`javascript
console.log("hello");
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: 'CREATE',
            filePath: 'src/index.js',
            content: 'console.log("hello");'
        });
    });

    test('should parse UPDATE FILE action', () => {
        const content = `
ACTION: UPDATE FILE: README.md
\`\`\`markdown
# New Title
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: 'UPDATE',
            filePath: 'README.md',
            content: '# New Title'
        });
    });

    test('should parse DELETE FILE action', () => {
        const content = `ACTION: DELETE FILE: old-file.txt`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: 'DELETE',
            filePath: 'old-file.txt',
            content: ''
        });
    });

    test('should parse RUN COMMAND action', () => {
        const content = `
ACTION: RUN COMMAND: install dependencies
\`\`\`bash
npm install
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: 'COMMAND',
            description: 'install dependencies',
            content: 'npm install'
        });
    });

    test('should parse multiple actions', () => {
        const content = `
I will help you with that.

ACTION: CREATE FILE: config.json
\`\`\`json
{"key": "val"}
\`\`\`

And then run this:

ACTION: RUN COMMAND: test
\`\`\`bash
npm test
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(2);
        expect(actions[0].type).toBe('CREATE');
        expect(actions[1].type).toBe('COMMAND');
    });

    test('should handle markdown bold stars in action headers', () => {
        const content = `**ACTION: UPDATE FILE: lib/utils.js**
\`\`\`javascript
export const sum = (a, b) => a + b;
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0].filePath).toBe('lib/utils.js');
    });

    test('should handle trailing stars in command description', () => {
        const content = `ACTION: RUN COMMAND: Build project**
\`\`\`bash
npm run build
\`\`\`
`;
        const actions = agent.parseActions(content);
        expect(actions).toHaveLength(1);
        expect(actions[0].description).toBe('Build project');
    });
});
