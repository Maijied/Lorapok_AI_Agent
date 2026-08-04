#!/usr/bin/env node

/**
 * before-prompt-assembler.js
 * 
 * Injected automatically BEFORE a prompt is processed.
 * This script scans the .agents workspace and reminds the agent
 * of all available tools, rules, and configurations it must leverage.
 */

const fs = require('fs');
const path = require('path');

/**
 * Retrieves a comma-separated list of items in the given directory path.
 * Ignores hidden files or directories starting with a dot.
 *
 * @param {string} dirPath - The absolute path to the directory to read.
 * @returns {string} Comma-separated directory contents, or 'None' if unavailable.
 */
function getDirectoryContents(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return 'None';
        const files = fs.readdirSync(dirPath);
        return files.filter(f => !f.startsWith('.')).join(', ') || 'None';
    } catch (e) {
        return 'Error reading directory';
    }
}

const agentsDir = path.join(process.cwd(), '.agents');

const availableSkills = getDirectoryContents(path.join(agentsDir, 'skills'));
const availableRules = getDirectoryContents(path.join(agentsDir, 'rules'));
const availableSteer = getDirectoryContents(path.join(agentsDir, 'steer'));
const availableSubagents = getDirectoryContents(path.join(agentsDir, 'subagents'));
const availableAutomations = getDirectoryContents(path.join(agentsDir, 'automations'));
const availableHooks = getDirectoryContents(path.join(agentsDir, 'hooks'));

let mcpServers = 'None';
try {
    const mcpPath = path.join(agentsDir, 'mcp.json');
    if (fs.existsSync(mcpPath)) {
        // ast-grep-ignore
        const mcpData = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
        mcpServers = Object.keys(mcpData.mcpServers || {}).join(', ') || 'None';
    }
} catch (e) {}

console.log(`
================================================================================
🧠 [LORAPOK PRE-PROMPT ASSEMBLER] 🧠

ATTENTION AGENT: A new user prompt is being processed. 
Before you begin formulating a plan or writing code, you MUST evaluate if any of 
the following project resources are needed for this task:

🔹 **Available Skills** (.agents/skills/): 
   ${availableSkills}
🔹 **Active MCP Servers** (.agents/mcp.json): 
   ${mcpServers}
🔹 **Mandatory Rules** (.agents/rules/): 
   ${availableRules}
🔹 **Steering Directives** (.agents/steer/): 
   ${availableSteer}
🔹 **Delegatable Subagents** (.agents/subagents/): 
   ${availableSubagents}
🔹 **Active Automations** (.agents/automations/): 
   ${availableAutomations}
🔹 **Active Hooks** (.agents/hooks/): 
   ${availableHooks}

If the user's prompt intersects with ANY of these capabilities, you must invoke 
the appropriate tool, skill, or rule immediately! Do not attempt to solve problems 
from scratch if a custom capability exists in the lists above.
================================================================================
`);
