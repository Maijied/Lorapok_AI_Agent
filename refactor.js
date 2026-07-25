const fs = require('fs');

let content = fs.readFileSync('index.js.bak', 'utf8');

const imports = `
const { executeCommand, withCancellation, handleError, setCwd } = require('./commands/utils');
const { showGitMenu } = require('./commands/git');
const { showActionsMenu } = require('./commands/actions');
const { showAuthMenu, applyToken } = require('./commands/auth');
const { showSettings, showLogs } = require('./commands/settings');
const { runProWorkflow } = require('./commands/workflow');
`;
content = content.replace("const readline = require('readline');\n", "const readline = require('readline');\n" + imports);

content = content.replace("let agent, config, currentCwd;\n", "let agent, config;\n");
content = content.replace("currentCwd = projectRoot;", "setCwd(projectRoot);");
content = content.replace(/await handleError\(err\);/g, "await handleError(err, agent, config);");
content = content.replace(/await runProWorkflow\(obj\);/g, "await runProWorkflow(agent, config, obj);");
content = content.replace(/await showGitMenu\(\);/g, "await showGitMenu(agent, config);");
content = content.replace(/await showActionsMenu\(\);/g, "await showActionsMenu(agent, config);");
content = content.replace(/await showSettings\(\);/g, "await showSettings(agent, config);");

function removeFunction(code, funcName) {
    const regex = new RegExp('(?:async )?function ' + funcName + '\\s*\\([\\s\\S]*?\\)\\s*\\{');
    const match = regex.exec(code);
    if (!match) return code;
    
    let startIndex = match.index;
    
    // find the previous /** manually to avoid regex greediness
    const beforeCode = code.substring(0, startIndex);
    const lastCommentStart = beforeCode.lastIndexOf('/**');
    if (lastCommentStart !== -1) {
        // check if it's only whitespace between comment end and function start
        const between = beforeCode.substring(beforeCode.lastIndexOf('*/') + 2);
        if (between.trim() === '') {
            startIndex = lastCommentStart;
        }
    }
    
    let index = match.index + match[0].length;
    let braceCount = 1;
    
    while (braceCount > 0 && index < code.length) {
        if (code[index] === '{') braceCount++;
        else if (code[index] === '}') braceCount--;
        index++;
    }
    
    return code.substring(0, startIndex) + code.substring(index);
}

const funcsToRemove = [
    'executeCommand',
    'withCancellation',
    'handleError',
    'showActionsMenu',
    'runProWorkflow',
    'showSettings',
    'showGitMenu',
    'showStashMenu',
    'showAdvancedGitMenu',
    'showRemoteMenu',
    'showLogs',
    'showAuthMenu',
    'applyToken'
];

for (const f of funcsToRemove) {
    content = removeFunction(content, f);
}

fs.writeFileSync('index.js', content);
console.log('Refactoring applied correctly.');
