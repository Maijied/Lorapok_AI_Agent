/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

const { getCommands, getAllHandlerNames, getCommandByName } = require('../commands/registry');

describe('Command registry', () => {
    test('includes core model and refresh commands', () => {
        const names = getCommands().map(c => c.name);
        expect(names).toContain('/model');
        expect(names).toContain('/refresh-models');
        expect(names).toContain('/settings');
        expect(names).toContain('/bypass');
    });

    test('aliases resolve via getCommandByName', () => {
        expect(getCommandByName('/models').handler).toBe('model');
        expect(getCommandByName('/yolo').handler).toBe('bypass');
        expect(getCommandByName('help').handler).toBe('help');
    });

    test('handlers cover registry entries', () => {
        const handlers = getAllHandlerNames();
        expect(handlers).toContain('model');
        expect(handlers).toContain('refresh-models');
        expect(handlers).toContain('git');
    });
});
