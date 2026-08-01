/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const chalk = require('chalk');
const boxen = require('boxen');

const DEFAULT_THEME_ID = 'Lorapok';

const FRAMES = {
    round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', boxen: 'round' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', boxen: 'double' },
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', boxen: 'single' },
    bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃', boxen: 'bold' }
};

function hex(c) {
    try { return chalk.hex(c); } catch (_) { return chalk.white; }
}

/**
 * Theme definitions — Lorapok default from Labs Bible / lorapok.tech.
 */
/** Bold wordmark fonts — each CLI theme gets a distinct figlet face */
const BOLD_FONT_FALLBACKS = [
    'ANSI Shadow', 'Banner3', 'Block', 'Doom', 'Big',
    'Larry 3D', '3D-ASCII', 'Delta Corps Priest 1', 'Slant', 'Standard'
];

const THEME_DEFS = {
    Lorapok: {
        id: 'Lorapok',
        label: 'Lorapok Labs',
        font: 'ANSI Shadow',
        frameStyle: 'round',
        density: 'compact',
        motion: 'subtle',
        hint: 'Default · ANSI Shadow',
        colors: {
            primary: '#00ff88',
            secondary: '#00e5ff',
            accent: '#00e5ff',
            muted: '#a0a0a0',
            success: '#00ff88',
            warning: '#ffb020',
            error: '#ff4d6d',
            info: '#00e5ff',
            border: '#00ff88',
            prompt: '#00ff88',
            modelBadge: '#00e5ff',
            usable: '#00ff88',
            paid: '#00e5ff',
            locked: '#a0a0a0',
            spinner: '#00ff88',
            text: '#f0f0f0',
            textMuted: '#a0a0a0',
            bug: '#00ff88',
            welcome: '#f0f0f0'
        }
    },
    Banner: {
        id: 'Banner',
        label: 'Banner',
        font: 'Banner3',
        frameStyle: 'bold',
        density: 'comfortable',
        motion: 'full',
        hint: 'Banner3 hash mark (#)',
        colors: {
            primary: '#00e5ff', secondary: '#00ff88', accent: '#67e8f9', muted: '#94a3b8',
            success: '#00ff88', warning: '#ffb020', error: '#ff4d6d', info: '#00e5ff',
            border: '#00e5ff', prompt: '#00e5ff', modelBadge: '#00ff88',
            usable: '#00ff88', paid: '#00e5ff', locked: '#94a3b8', spinner: '#00e5ff',
            text: '#f0fdfa', textMuted: '#94a3b8', bug: '#00ff88', welcome: '#ffffff'
        }
    },
    Slant: {
        id: 'Slant',
        label: 'Slant',
        font: 'Slant',
        frameStyle: 'round',
        density: 'comfortable',
        motion: 'full',
        hint: 'Slant bold italic',
        colors: {
            primary: '#f5d76e', secondary: '#67e8f9', accent: '#f5d76e', muted: '#9ca3af',
            success: '#4ade80', warning: '#fbbf24', error: '#f87171', info: '#67e8f9',
            border: '#f5d76e', prompt: '#f5d76e', modelBadge: '#67e8f9',
            usable: '#4ade80', paid: '#fbbf24', locked: '#9ca3af', spinner: '#f5d76e',
            text: '#f8fafc', textMuted: '#9ca3af', bug: '#67e8f9', welcome: '#ffffff'
        }
    },
    Graceful: {
        id: 'Graceful',
        label: 'Graceful',
        font: 'Block',
        frameStyle: 'round',
        density: 'comfortable',
        motion: 'subtle',
        hint: 'Block bold',
        colors: {
            primary: '#22d3ee', secondary: '#4ade80', accent: '#22d3ee', muted: '#94a3b8',
            success: '#4ade80', warning: '#fbbf24', error: '#f87171', info: '#22d3ee',
            border: '#22d3ee', prompt: '#22d3ee', modelBadge: '#4ade80',
            usable: '#4ade80', paid: '#22d3ee', locked: '#94a3b8', spinner: '#22d3ee',
            text: '#f8fafc', textMuted: '#94a3b8', bug: '#4ade80', welcome: '#ffffff'
        }
    },
    Executive: {
        id: 'Executive',
        label: 'Executive',
        font: 'Doom',
        frameStyle: 'double',
        density: 'comfortable',
        motion: 'subtle',
        hint: 'Doom bold',
        colors: {
            primary: '#3b82f6', secondary: '#60a5fa', accent: '#60a5fa', muted: '#94a3b8',
            success: '#22c55e', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6',
            border: '#3b82f6', prompt: '#3b82f6', modelBadge: '#60a5fa',
            usable: '#22c55e', paid: '#3b82f6', locked: '#94a3b8', spinner: '#3b82f6',
            text: '#f8fafc', textMuted: '#94a3b8', bug: '#fbbf24', welcome: '#ffffff'
        }
    },
    Engineering: {
        id: 'Engineering',
        label: 'Engineering',
        font: 'Standard',
        frameStyle: 'bold',
        density: 'compact',
        motion: 'subtle',
        hint: 'Standard bold',
        colors: {
            primary: '#22c55e', secondary: '#67e8f9', accent: '#22c55e', muted: '#86efac',
            success: '#22c55e', warning: '#eab308', error: '#ef4444', info: '#67e8f9',
            border: '#22c55e', prompt: '#22c55e', modelBadge: '#67e8f9',
            usable: '#22c55e', paid: '#eab308', locked: '#6b7280', spinner: '#22c55e',
            text: '#f0fdf4', textMuted: '#86efac', bug: '#67e8f9', welcome: '#ffffff'
        }
    },
    Big: {
        id: 'Big',
        label: 'Big',
        font: 'Big',
        frameStyle: 'round',
        density: 'comfortable',
        motion: 'full',
        hint: 'Big bold',
        colors: {
            primary: '#d946ef', secondary: '#fbbf24', accent: '#d946ef', muted: '#a78bfa',
            success: '#4ade80', warning: '#fbbf24', error: '#f87171', info: '#c084fc',
            border: '#d946ef', prompt: '#d946ef', modelBadge: '#fbbf24',
            usable: '#4ade80', paid: '#fbbf24', locked: '#a78bfa', spinner: '#d946ef',
            text: '#faf5ff', textMuted: '#a78bfa', bug: '#fbbf24', welcome: '#ffffff'
        }
    },
    Cyberlarge: {
        id: 'Cyberlarge',
        label: 'Cyberlarge',
        font: '3D-ASCII',
        frameStyle: 'double',
        density: 'comfortable',
        motion: 'full',
        hint: '3D-ASCII bold',
        colors: {
            primary: '#00ffcc', secondary: '#ff007f', accent: '#00ffcc', muted: '#94a3b8',
            success: '#00ffcc', warning: '#ffb020', error: '#ff007f', info: '#00e5ff',
            border: '#00ffcc', prompt: '#00ffcc', modelBadge: '#ff007f',
            usable: '#00ffcc', paid: '#ff007f', locked: '#94a3b8', spinner: '#00ffcc',
            text: '#f0fdfa', textMuted: '#94a3b8', bug: '#ff007f', welcome: '#ffffff'
        }
    },
    Mini: {
        id: 'Mini',
        label: 'Mini',
        font: 'Larry 3D',
        frameStyle: 'single',
        density: 'compact',
        motion: 'off',
        hint: 'Larry 3D bold',
        colors: {
            primary: '#e5e7eb', secondary: '#9ca3af', accent: '#d1d5db', muted: '#6b7280',
            success: '#9ca3af', warning: '#d1d5db', error: '#9ca3af', info: '#9ca3af',
            border: '#9ca3af', prompt: '#e5e7eb', modelBadge: '#9ca3af',
            usable: '#d1d5db', paid: '#9ca3af', locked: '#6b7280', spinner: '#9ca3af',
            text: '#f3f4f6', textMuted: '#6b7280', bug: '#9ca3af', welcome: '#9ca3af'
        }
    },
    Roman: {
        id: 'Roman',
        label: 'Roman',
        font: 'Delta Corps Priest 1',
        frameStyle: 'double',
        density: 'comfortable',
        motion: 'subtle',
        hint: 'Delta Corps Priest 1',
        colors: {
            primary: '#ff3333', secondary: '#ff9900', accent: '#ff3333', muted: '#a8a29e',
            success: '#22c55e', warning: '#ff9900', error: '#ff3333', info: '#ff9900',
            border: '#ff3333', prompt: '#ff3333', modelBadge: '#ff9900',
            usable: '#22c55e', paid: '#ff9900', locked: '#a8a29e', spinner: '#ff3333',
            text: '#fafaf9', textMuted: '#a8a29e', bug: '#ff9900', welcome: '#ffffff'
        }
    }
};

function buildChalkMap(colors) {
    const out = {};
    for (const [k, v] of Object.entries(colors)) {
        out[k] = hex(v);
    }
    return out;
}

function getDefaultThemeId() {
    return DEFAULT_THEME_ID;
}

function listThemes() {
    return Object.values(THEME_DEFS).map(t => ({
        id: t.id,
        label: t.label,
        hint: t.hint || '',
        font: t.font,
        frameStyle: t.frameStyle,
        density: t.density,
        motion: t.motion
    }));
}

function getTheme(name) {
    const id = name && THEME_DEFS[name] ? name : DEFAULT_THEME_ID;
    const def = THEME_DEFS[id];
    const chalkMap = buildChalkMap(def.colors);
    const frame = FRAMES[def.frameStyle] || FRAMES.round;

    return {
        ...def,
        chalk: chalkMap,
        frame,
        color(key, text) {
            const fn = chalkMap[key] || chalk.white;
            return fn(text);
        },
        primary(text) { return chalkMap.primary(text); },
        secondary(text) { return chalkMap.secondary(text); },
        muted(text) { return chalkMap.muted ? chalkMap.muted(text) : chalk.gray(text); },
        success(text) { return chalkMap.success(text); },
        warning(text) { return chalkMap.warning(text); },
        error(text) { return chalkMap.error(text); },
        info(text) { return chalkMap.info(text); },
        box(content, opts = {}) {
            const pad = def.density === 'compact'
                ? { top: 0, bottom: 0, left: 1, right: 1 }
                : 1;
            return boxen(String(content), {
                padding: pad,
                margin: { top: 0, bottom: 0, left: 0, right: 0 },
                borderStyle: frame.boxen || 'round',
                borderColor: def.colors.border,
                dimBorder: false,
                ...opts
            });
        },
        /** Slim professional panel for status / tips */
        panel(content, opts = {}) {
            return this.box(content, {
                padding: { top: 0, bottom: 0, left: 1, right: 1 },
                borderStyle: frame.boxen || 'round',
                ...opts
            });
        },
        /**
         * Compact left | right status row with optional underline.
         * Prefer a single professional line over huge gaps.
         */
        statusBar(left, right, width) {
            const strip = (str) => String(str || '').replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
            const cols = Math.min(width || process.stdout.columns || 80, 96);
            const L = String(left || '');
            const R = String(right || '');
            const sep = chalkMap.muted(' | ');
            const combined = L + (R ? sep + R : '');
            if (strip(combined).length <= cols - 2) {
                return '  ' + combined;
            }
            const gap = Math.max(2, cols - strip(L).length - strip(R).length - 2);
            return '  ' + L + ' '.repeat(gap) + R;
        },
        /** Horizontal rule under headers / after responses */
        rule(width) {
            const cols = Math.min(width || process.stdout.columns || 80, 96);
            return chalkMap.muted('  ' + (frame.h || '\u2500').repeat(Math.max(24, cols - 2)));
        },
        /** Join metric segments with | separators */
        sepJoin(parts, colorKey = 'muted') {
            const fn = chalkMap[colorKey] || chalk.gray;
            const sep = fn(' | ');
            return (parts || []).filter(Boolean).map(p => {
                if (typeof p === 'string') return fn(p);
                if (p && p.text != null) {
                    const c = chalkMap[p.color] || fn;
                    return c(p.text);
                }
                return fn(String(p));
            }).join(sep);
        },
        promptPrefix(activeModelStatus) {
            const badge = activeModelStatus && activeModelStatus.promptBadge
                ? chalkMap.modelBadge(activeModelStatus.promptBadge)
                : chalkMap.modelBadge('\u25C6');
            return badge;
        },
        applyToOra(spinner) {
            if (spinner && typeof spinner.color !== 'undefined') {
                spinner.color = id === 'Lorapok' || id === 'Engineering' ? 'green'
                    : id === 'Roman' ? 'red'
                        : id === 'Big' ? 'magenta'
                            : 'cyan';
            }
            return spinner;
        }
    };
}

module.exports = {
    THEME_DEFS,
    FRAMES,
    BOLD_FONT_FALLBACKS,
    DEFAULT_THEME_ID,
    getDefaultThemeId,
    getTheme,
    listThemes
};
