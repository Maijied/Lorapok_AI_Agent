#!/usr/bin/env node
/**
 * Live model sanitize probe — prints access table (never prints API keys).
 * Usage: node scripts/probe-models.js
 */
'use strict';

require('dotenv').config();
const { ModelManager } = require('../services/ModelManager');
const { ModelSanitizeService } = require('../services/ModelSanitizeService');
const { LorapokConfig } = require('../lib/config');

async function main() {
    const config = new LorapokConfig();
    const mm = new ModelManager(config);
    const sanitizer = new ModelSanitizeService(mm);
    console.log('Running dynamic sanitize (discover → probe)...\n');
    const result = await sanitizer.sanitize({
        force: true,
        config,
        selectedModel: config.getModel()
    });

    const rows = Object.entries(result.validated).map(([id, m]) => ({
        provider: m.provider,
        id,
        payment: m.paymentRequired ? 'paid' : 'free',
        access: m.accessState || 'unverified',
        available: m.available
    }));

    rows.sort((a, b) => String(a.provider).localeCompare(b.provider) || a.id.localeCompare(b.id));

    const interesting = rows.filter(r =>
        r.provider === 'google-ai-studio' ||
        r.provider === 'perplexity' ||
        r.payment === 'free' ||
        ['accessible', 'rate_limited', 'unavailable', 'locked', 'error'].includes(r.access)
    );
    for (const r of interesting.slice(0, 100)) {
        console.log(`${r.provider.padEnd(16)} ${r.payment.padEnd(5)} ${String(r.access).padEnd(12)} ${r.id}`);
    }
    if (interesting.length > 100) console.log(`... +${interesting.length - 100} more interesting rows`);
    console.log(`(Full catalog: ${rows.length} models; unpaid OpenRouter skipped in print)`);

    console.log('\nStats:', result.stats);
    console.log('Usable (sorted):', result.views.usable.slice(0, 20));
    console.log('Selectable (sorted):', result.views.selectable.slice(0, 20));

    const locked = rows.filter(r => r.access === 'locked');
    if (locked.length) {
        console.log('\nLocked (check API keys / credits):');
        for (const r of locked) {
            console.log(`  - ${r.provider} ${r.id}`);
        }
    }
}

main().catch(err => {
    console.error(err.message);
    process.exit(1);
});
