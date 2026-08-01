/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 *
 * Single source of truth for slash commands (autocomplete, system menu, help, Docs).
 */
'use strict';

/** @typedef {'core'|'controls'|'devops'|'system'} CommandSection */

/**
 * @type {Array<{
 *   name: string,
 *   aliases?: string[],
 *   section: CommandSection,
 *   description: string,
 *   icon?: string,
 *   handler: string,
 *   inAutocomplete?: boolean,
 *   inSystemMenu?: boolean
 * }>}
 */
const COMMANDS = [
    { name: '/chat', section: 'core', description: 'Interactive AI chat', icon: '💬', handler: 'chat', inAutocomplete: true, inSystemMenu: true },
    { name: '/plan', section: 'core', description: 'Plan & execute multi-step objective', icon: '📝', handler: 'plan', inAutocomplete: true, inSystemMenu: true },
    { name: '/analyze', section: 'core', description: 'Deep repository audit', icon: '🔍', handler: 'analyze', inAutocomplete: true, inSystemMenu: true },
    { name: '/model', aliases: ['/models'], section: 'controls', description: 'View, switch, or list AI models', icon: '🧠', handler: 'model', inAutocomplete: true, inSystemMenu: true },
    { name: '/settings', section: 'controls', description: 'Customize themes & preferences', icon: '🎨', handler: 'settings', inAutocomplete: true, inSystemMenu: true },
    { name: '/refresh-models', section: 'controls', description: 'Re-fetch & re-validate model catalog', icon: '🔄', handler: 'refresh-models', inAutocomplete: true, inSystemMenu: true },
    { name: '/cache', section: 'controls', description: 'Response cache stats / clear / toggle', icon: '💾', handler: 'cache', inAutocomplete: true, inSystemMenu: true },
    { name: '/config', section: 'controls', description: 'Inspect or set config keys', icon: '⚙️', handler: 'config', inAutocomplete: true, inSystemMenu: false },
    { name: '/bypass', aliases: ['/yolo'], section: 'controls', description: 'Toggle auto-approve for actions', icon: '⚡', handler: 'bypass', inAutocomplete: true, inSystemMenu: true },
    { name: '/git', section: 'devops', description: 'Git status, commit, branch, sync', icon: '🌿', handler: 'git', inAutocomplete: true, inSystemMenu: true },
    { name: '/status', section: 'devops', description: 'Git working tree status', icon: '📊', handler: 'status', inAutocomplete: false, inSystemMenu: false },
    { name: '/commit', section: 'devops', description: 'Create a git commit', icon: '📦', handler: 'commit', inAutocomplete: false, inSystemMenu: false },
    { name: '/diff', section: 'devops', description: 'Show git diff', icon: '📑', handler: 'diff', inAutocomplete: false, inSystemMenu: false },
    { name: '/branch', section: 'devops', description: 'List or switch branches', icon: '🌲', handler: 'branch', inAutocomplete: false, inSystemMenu: false },
    { name: '/actions', aliases: ['/ci'], section: 'devops', description: 'Background actions & workflows', icon: '🎬', handler: 'actions', inAutocomplete: true, inSystemMenu: true },
    { name: '/files', section: 'devops', description: 'Show project file tree', icon: '📁', handler: 'files', inAutocomplete: true, inSystemMenu: true },
    { name: '/guide', aliases: ['/howtouse', '/manual'], section: 'system', description: 'How to use Lorapok', icon: '📖', handler: 'guide', inAutocomplete: true, inSystemMenu: true },
    { name: '/help', aliases: ['/?'], section: 'system', description: 'Command reference + model status color legend', icon: '❓', handler: 'help', inAutocomplete: true, inSystemMenu: true },
    { name: '/logs', section: 'system', description: 'View recent logs', icon: '📜', handler: 'logs', inAutocomplete: true, inSystemMenu: true },
    { name: '/sessions', section: 'system', description: 'Browse saved session recaps', icon: '📁', handler: 'sessions', inAutocomplete: true, inSystemMenu: true },
    { name: '/clear', section: 'system', description: 'Clear the terminal', icon: '🧹', handler: 'clear', inAutocomplete: true, inSystemMenu: true },
    { name: '/menu', section: 'system', description: 'Open system command menu', icon: '📋', handler: 'menu', inAutocomplete: false, inSystemMenu: false },
    { name: '/exit', aliases: ['/quit', '/q'], section: 'system', description: 'Exit Lorapok', icon: '🚪', handler: 'exit', inAutocomplete: true, inSystemMenu: true }
];

const SECTION_LABELS = {
    core: 'CORE AI',
    controls: 'CONTROLS',
    devops: 'DEVOPS',
    system: 'SYSTEM'
};

const SECTION_ICONS = {
    core: '🤖',
    controls: '🎛️',
    devops: '🛠️',
    system: '⚙️'
};

function getCommands() {
    return COMMANDS.slice();
}

function getCommandByName(name) {
    const n = String(name || '').trim().toLowerCase();
    const withSlash = n.startsWith('/') ? n : `/${n}`;
    return COMMANDS.find(c =>
        c.name === withSlash ||
        (c.aliases || []).includes(withSlash) ||
        c.handler === n.replace(/^\//, '')
    ) || null;
}

function getAutocompleteChoices(chalk) {
    const { padIcon, commandMenuMessage } = require('../lib/menu-format');
    const sections = ['core', 'controls', 'devops', 'system'];
    const choices = [];
    for (const section of sections) {
        const items = COMMANDS.filter(c => c.section === section && c.inAutocomplete !== false);
        if (items.length === 0) continue;
        if (choices.length) {
            choices.push({ role: 'separator', message: ' ', disabled: true });
        }
        const secIcon = SECTION_ICONS[section] || '·';
        choices.push({
            role: 'heading',
            message: chalk
                ? chalk.cyan.bold(`  ${padIcon(secIcon, 2)} ${SECTION_LABELS[section]}`)
                : `  ${padIcon(secIcon, 2)} ${SECTION_LABELS[section]}`,
            disabled: true
        });
        for (const c of items) {
            const icon = c.icon || '·';
            const msg = commandMenuMessage(
                icon,
                c.name,
                c.description,
                chalk ? chalk.bold.bind(chalk) : null,
                chalk ? chalk.gray.bind(chalk) : null
            );
            choices.push({ name: c.name, message: msg });
        }
    }
    return choices;
}

function getSystemMenuChoices(chalk) {
    const { padIcon, commandMenuMessage, backChoice } = require('../lib/menu-format');
    const sections = ['core', 'controls', 'devops', 'system'];
    const choices = [];
    for (const section of sections) {
        const items = COMMANDS.filter(c => c.section === section && c.inSystemMenu);
        if (items.length === 0) continue;
        if (choices.length) {
            choices.push({ role: 'separator', message: ' ', disabled: true });
        }
        const secIcon = SECTION_ICONS[section] || '·';
        choices.push({
            role: 'heading',
            message: chalk
                ? chalk.cyan.bold(`  ${padIcon(secIcon, 2)} ${SECTION_LABELS[section]}`)
                : `  ${padIcon(secIcon, 2)} ${SECTION_LABELS[section]}`,
            disabled: true
        });
        for (const c of items) {
            const icon = c.icon || '·';
            const msg = commandMenuMessage(
                icon,
                c.handler,
                c.description,
                chalk ? chalk.bold.bind(chalk) : null,
                chalk ? chalk.gray.bind(chalk) : null
            );
            choices.push({ name: c.handler, message: msg });
        }
    }
    choices.push({ role: 'separator', message: ' ', disabled: true });
    const back = backChoice('__back__', { indent: 4 });
    if (chalk) {
        back.message = chalk.gray(back.message);
    }
    choices.push(back);
    return choices;
}

function getHelpRows() {
    return COMMANDS.filter(c => c.inAutocomplete !== false || c.inSystemMenu).map(c => ({
        command: c.name + (c.aliases?.length ? ` (${c.aliases.join(', ')})` : ''),
        description: c.description,
        section: c.section
    }));
}

function getAllHandlerNames() {
    const set = new Set();
    for (const c of COMMANDS) {
        set.add(c.handler);
        set.add(c.name.replace(/^\//, ''));
        for (const a of c.aliases || []) set.add(a.replace(/^\//, ''));
    }
    return [...set];
}

module.exports = {
    COMMANDS,
    SECTION_LABELS,
    getCommands,
    getCommandByName,
    getAutocompleteChoices,
    getSystemMenuChoices,
    getHelpRows,
    getAllHandlerNames
};
