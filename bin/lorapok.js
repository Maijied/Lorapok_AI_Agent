#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Helper to use chalk if available on host, otherwise fallback
function getChalk() {
    try {
        return require('chalk');
    } catch (e) {
        return {
            cyan: s => s, gray: s => s, yellow: s => s,
            red: s => s, green: s => s, white: s => s,
            magenta: s => s, blue: s => s, bold: s => s
        };
    }
}
const chalk = getChalk();

// Check if we are already inside the Lorapok Docker container
if (process.env.LORAPOK_DOCKER === 'true') {
    // If inside Docker, run the actual agent logic
    require('../index.js');
} else {
    // If on the host machine, redirect the command to Docker Compose
    const args = process.argv.slice(2);
    const cwd = path.join(__dirname, '..');

    // Auto-build check: If node_modules inside docker don't exist or image is missing
    // In this repo, since we mount the volume, we mainly care about the image existing
    if (args.includes('--build')) {
        console.log(chalk.yellow('🛠️  Forcing Docker rebuild...'));
        spawnSync('docker', ['compose', 'build'], { stdio: 'inherit', cwd, shell: true });
    }

    console.log(chalk.cyan('\n🐛 Lorapok: Redirecting to Docker container...'));

    const dockerArgs = ['compose', 'run', '--rm', '-e', 'LORAPOK_DOCKER=true', 'lorapok', 'node', 'bin/lorapok.js', ...args];

    const result = spawnSync('docker', dockerArgs, {
        stdio: 'inherit',
        cwd: cwd,
        shell: true
    });

    if (result.error) {
        console.error(chalk.red('\n❌ Failed to start Docker.'));
        console.error(chalk.gray('   Is Docker Desktop running? Is "docker compose" available?'));
        process.exit(1);
    }

    process.exit(result.status);
}
