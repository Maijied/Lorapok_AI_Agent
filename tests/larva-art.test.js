'use strict';

const {
    THEME_LARVAE,
    CLASSIC_THEME_LARVAE,
    getThemeLarvaLines,
    renderLarvaBlock,
    renderAiCodingBadge,
    listLogoStyles,
    resolveLogoStyle
} = require('../lib/larva-art');
const { getTheme, listThemes } = require('../lib/theme');
const TerminalUI = require('../lib/ui');

describe('Per-theme larva logos', () => {
    test('every theme id has a distinct cyber larva mark', () => {
        const themes = listThemes();
        const signatures = new Set();
        for (const th of themes) {
            const lines = getThemeLarvaLines(th.id, 'cyber');
            expect(lines.length).toBeGreaterThan(0);
            signatures.add(lines.join('\n'));
        }
        expect(signatures.size).toBe(themes.length);
    });

    test('classic and cyber logo styles differ', () => {
        const cyber = getThemeLarvaLines('Lorapok', 'cyber').join('\n');
        const classic = getThemeLarvaLines('Lorapok', 'classic').join('\n');
        expect(cyber).toContain('{');
        expect(cyber).toMatch(/\/\|/);
        expect(classic).not.toMatch(/\/\|/);
        expect(classic).toContain('{');
        expect(listLogoStyles().map(s => s.id)).toEqual(expect.arrayContaining(['cyber', 'classic']));
        expect(resolveLogoStyle('classic').id).toBe('classic');
    });

    test('renderLarvaBlock colorizes Lorapok larva', () => {
        const theme = getTheme('Lorapok');
        const block = renderLarvaBlock(0, theme, { themeId: 'Lorapok', logoStyle: 'cyber' });
        expect(block.join('\n')).toContain('{');
        expect(THEME_LARVAE.Roman).not.toEqual(THEME_LARVAE.Lorapok);
        expect(CLASSIC_THEME_LARVAE.Lorapok).toBeTruthy();
    });

    test('getLarvaSpinnerFrames returns frames', () => {
        const { getLarvaSpinnerFrames } = require('../lib/larva-art');
        const frames = getLarvaSpinnerFrames(getTheme('Lorapok'));
        expect(frames.length).toBeGreaterThanOrEqual(3);
    });

    test('cyber larva is soldier-fly coding agent emblem', () => {
        const art = getThemeLarvaLines('Lorapok', 'cyber').join('\n');
        expect(art).toContain('{');
        expect(art).toMatch(/\/\|/);
        expect(art).toMatch(/\|\\/);
        expect(art).not.toContain('>_');
    });

    test('AI Coding badge is polished center panel', () => {
        const theme = getTheme('Lorapok');
        const badge = renderAiCodingBadge(theme);
        const text = badge.join('\n');
        expect(text).toMatch(/AI CODING/);
        expect(text).toContain('</>');
        expect(text).toMatch(/Agent Core\|/);
        expect(text).toMatch(/[┏┗]/);
    });

    test('cyber branding: LORAPOK AI beside + boxed meta footer', () => {
        const raw = TerminalUI.getBranding('Lorapok', 0, '1.4.0', 'gemini-flash-latest', '/tmp/proj', 'cyber');
        const plain = raw.replace(/\u001b\[[0-9;]*m/g, '');
        expect(plain).toContain('Lorapok AI Coding Agent');
        expect(plain).toContain('gemini-flash-latest');
        expect(plain).toContain('/tmp/proj');
        expect(plain).not.toContain('SYSTEM ONLINE');
        expect(plain).not.toContain('https://ai.lorapok.tech');
        // AI not stacked as separate figlet under LORAPOK — single LORAPOK AI band
        expect(plain).toMatch(/[╭┌]/);
    });

    test('classic branding includes Agent Core| panel', () => {
        const raw = TerminalUI.getBranding('Lorapok', 0, '1.4.0', 'model', '/tmp', 'classic');
        const plain = raw.replace(/\u001b\[[0-9;]*m/g, '');
        expect(plain).toContain('AI CODING');
        expect(plain).toContain('Agent Core|');
    });
});
