'use strict';

const { ModelManager } = require('../services/ModelManager');
const { ActiveModelService } = require('../services/ActiveModelService');

describe('ActiveModelService', () => {
    test('getStatus returns professional fields', () => {
        const mm = new ModelManager();
        const svc = new ActiveModelService(mm);
        const config = { getModel: () => 'sonar' };
        const validated = {
            sonar: {
                id: 'sonar',
                name: '⚡ Sonar (Perplexity)',
                provider: 'perplexity',
                paymentRequired: false,
                accessState: 'accessible',
                contextLength: 100000
            }
        };
        const status = svc.getStatus(config, validated, {
            modelUsage: { sonar: { total: 25000 } }
        });
        expect(status.id).toBe('sonar');
        expect(status.displayName).toBe('Sonar');
        expect(status.promptBadge).toBe('Sonar');
        expect(status.promptRight).toContain('75%');
        expect(status.contextPct).toBe(75);
        expect(status.ctxTone).toBe('success');
        expect(status.shortLine).toBeTruthy();
    });
});

