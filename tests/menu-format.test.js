/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const {
    stripVariationSelectors,
    termWidth,
    padIcon,
    menuMessage,
    menuChoice,
    commandMenuMessage,
    backChoice
} = require('../lib/menu-format');

describe('menu-format', () => {
    test('stripVariationSelectors removes emoji presentation selectors', () => {
        expect(stripVariationSelectors('♻️')).toBe('♻');
        expect(stripVariationSelectors('⚙️')).toBe('⚙');
        expect(stripVariationSelectors('👤')).toBe('👤');
    });

    test('padIcon aligns narrow and wide icons to the same display width', () => {
        const a = padIcon('✓', 2);
        const b = padIcon('👤', 2);
        const c = padIcon('♻', 2);
        const d = padIcon('🔑', 2);
        const e = padIcon('⚡', 2);
        expect(termWidth(a)).toBe(2);
        expect(termWidth(b)).toBe(2);
        expect(termWidth(c)).toBe(2);
        expect(termWidth(d)).toBe(2);
        expect(termWidth(e)).toBe(2);
        // ⚡ is emoji-wide — must not get an extra pad space (that shifted /bypass)
        expect(e).toBe('⚡');
        expect(c.endsWith(' ')).toBe(true);
    });

    test('commandMenuMessage keeps /bypass aligned with other control commands', () => {
        const model = commandMenuMessage('🧠', 'model', 'View, switch, or list AI models');
        const bypass = commandMenuMessage('⚡', 'bypass', 'Toggle auto-approve for actions');
        const config = commandMenuMessage('🔧', 'config', 'Inspect or set config values');
        const col = (row, cmd) => termWidth(row.slice(0, row.indexOf(cmd)));
        expect(col(bypass, 'bypass')).toBe(col(model, 'model'));
        expect(col(bypass, 'bypass')).toBe(col(config, 'config'));
    });

    test('menuMessage places labels on a shared column after the icon', () => {
        const rows = [
            menuMessage('👤', 'Change user name'),
            menuMessage('🔑', 'Update API key (encrypted vault)'),
            menuMessage('♻', 'Reset Lorapok AI'),
            menuMessage('←', 'Back to previous menu')
        ];
        const labelCols = rows.map(r => {
            const before = r.slice(0, r.search(/Change user name|Update API key|Reset Lorapok|Back to previous/));
            return termWidth(before);
        });
        expect(new Set(labelCols).size).toBe(1);
        expect(labelCols[0]).toBe(5); // indent 2 + icon 2 + gap 1
    });

    test('menuChoice and backChoice return enquirer-compatible objects', () => {
        const row = menuChoice('name', '👤', 'Change user name');
        expect(row).toEqual({
            name: 'name',
            message: menuMessage('👤', 'Change user name')
        });
        const back = backChoice('reject');
        expect(back.name).toBe('reject');
        expect(back.message).toContain('Back to previous menu');
        expect(back.message.startsWith('  ')).toBe(true);
    });

    test('commandMenuMessage keeps command column after padded icon', () => {
        const a = commandMenuMessage('🧠', '/model', 'Switch model');
        const b = commandMenuMessage('⚙', '/settings', 'Open settings');
        const colA = termWidth(a.slice(0, a.indexOf('/model')));
        const colB = termWidth(b.slice(0, b.indexOf('/settings')));
        expect(colA).toBe(colB);
        expect(a).toContain('Switch model');
        expect(b).toContain('Open settings');
    });
});
