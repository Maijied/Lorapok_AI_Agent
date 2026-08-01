'use strict';

const { getTheme, getDefaultThemeId, listThemes, THEME_DEFS } = require('../lib/theme');

describe('ThemeEngine', () => {
    test('default theme is Lorapok', () => {
        expect(getDefaultThemeId()).toBe('Lorapok');
        expect(THEME_DEFS.Lorapok.colors.primary).toBe('#00ff88');
        expect(THEME_DEFS.Lorapok.colors.secondary).toBe('#00e5ff');
    });

    test('invalid theme falls back to Lorapok', () => {
        const t = getTheme('NotARealTheme');
        expect(t.id).toBe('Lorapok');
    });

    test('each theme has distinct primary color or frame', () => {
        const themes = listThemes();
        expect(themes.length).toBeGreaterThanOrEqual(8);
        const primaries = new Set(themes.map(th => THEME_DEFS[th.id].colors.primary));
        expect(primaries.size).toBeGreaterThan(3);
        const frames = new Set(themes.map(th => th.frameStyle));
        expect(frames.size).toBeGreaterThan(1);
    });

    test('theme helpers colorize and box', () => {
        const t = getTheme('Lorapok');
        expect(t.primary('x')).toContain('x');
        expect(t.box('hello')).toContain('hello');
        expect(t.panel('status')).toContain('status');
        expect(t.statusBar('left', 'right', 40)).toContain('left');
        expect(t.statusBar('left', 'right', 40)).toContain('right');
        expect(t.statusBar('left', 'right', 40)).toContain('|');
        expect(t.rule(40)).toMatch(/[─━═]/);
        expect(t.sepJoin([{ text: 'a', color: 'muted' }, { text: 'b', color: 'muted' }])).toContain('|');
        expect(t.promptPrefix({ promptBadge: '⚡ Model' })).toContain('Model');
    });

    test('each theme has a distinct bold wordmark font', () => {
        const fonts = listThemes().map(th => THEME_DEFS[th.id].font);
        expect(new Set(fonts).size).toBe(fonts.length);
        expect(THEME_DEFS.Lorapok.font).toBe('ANSI Shadow');
        expect(THEME_DEFS.Banner.font).toBe('Banner3');
        expect(THEME_DEFS.Slant.font).toBe('Slant');
        expect(THEME_DEFS.Graceful.font).toBe('Block');
        expect(THEME_DEFS.Executive.font).toBe('Doom');
        expect(THEME_DEFS.Engineering.font).toBe('Standard');
        expect(THEME_DEFS.Big.font).toBe('Big');
        expect(THEME_DEFS.Cyberlarge.font).toBe('3D-ASCII');
        expect(THEME_DEFS.Mini.font).toBe('Larry 3D');
        expect(THEME_DEFS.Roman.font).toBe('Delta Corps Priest 1');
    });
});

