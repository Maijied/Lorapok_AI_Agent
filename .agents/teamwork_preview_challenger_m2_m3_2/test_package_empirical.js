/**
 * Empirical Test Harness for package packaging (Task 3)
 */
'use strict';

const assert = require('assert');
const { execSync } = require('child_process');
const pkg = require('../../package.json');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`  ✓ ${description}`);
        passCount++;
    } catch (err) {
        console.error(`  ✗ ${description}`);
        console.error(`    ${err.stack || err}`);
        failCount++;
    }
}

function run() {
    console.log('\n--- Empirical Testing: Package files & npm pack ---\n');

    test('package.json files array configuration', () => {
        assert(Array.isArray(pkg.files), 'package.json should have a files array');
        const expectedItems = [
            'bin/',
            'commands/',
            'lib/',
            'services/',
            'index.js',
            'server.js',
            'README.md',
            'LICENSE'
        ];
        for (const item of expectedItems) {
            assert(pkg.files.includes(item), `package.json files array missing ${item}`);
        }
    });

    test('npm pack --dry-run contents inspection', () => {
        const output = execSync('npm pack --dry-run 2>&1', { encoding: 'utf8' });
        
        // Parse lines like "npm notice 2.0kB bin/lorapok.js" or "npm notice 1.1kB LICENSE"
        const packedFiles = [];
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('npm notice') && !line.includes('Tarball') && !line.includes('notice name:') && !line.includes('notice version:') && !line.includes('notice filename:') && !line.includes('notice package size:') && !line.includes('notice unpacked size:') && !line.includes('notice shasum:') && !line.includes('notice integrity:') && !line.includes('notice total files:')) {
                const parts = line.trim().split(/\s+/);
                // parts format: ['npm', 'notice', '2.0kB', 'bin/lorapok.js']
                if (parts.length >= 4 && /^\d+(\.\d+)?[a-zA-Z]+$/.test(parts[2])) {
                    packedFiles.push(parts.slice(3).join(' '));
                }
            }
        }

        console.log('    Parsed packed files:', packedFiles);

        // Required paths check
        const requiredPaths = [
            'bin/',
            'commands/',
            'lib/',
            'services/',
            'index.js',
            'server.js',
            'README.md',
            'LICENSE',
            'package.json'
        ];

        for (const req of requiredPaths) {
            const prefix = req.endsWith('/') ? req : req;
            const match = packedFiles.some(f => f === req || f.startsWith(req));
            assert(match, `npm pack tarball missing required path matching: ${req}`);
        }

        // Prohibited paths check (tests, .github, .agents, .env)
        const forbiddenPrefixes = ['tests/', '.github/', '.agents/', '.env'];
        for (const forb of forbiddenPrefixes) {
            const matches = packedFiles.filter(f => f.startsWith(forb));
            assert.strictEqual(matches.length, 0, `npm pack tarball illegally includes forbidden path ${forb}: ${matches.join(', ')}`);
        }
    });

    console.log(`\nResults: ${passCount} passed, ${failCount} failed.\n`);
    if (failCount > 0) {
        process.exit(1);
    }
}

run();
