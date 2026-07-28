#!/usr/bin/env node
/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Proprietary & Confidential. All Rights Reserved.
 */
'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');

/**
 * Lorapok CLI Entry Point
 * Runs natively on Node.js by default.
 * Preserves Docker mode if --docker is passed or LORAPOK_USE_DOCKER=true is set.
 */

const isInsideContainer = process.env.LORAPOK_DOCKER === 'true';
const forceDocker = process.argv.includes('--docker') || process.env.LORAPOK_USE_DOCKER === 'true';
const forceLocal = process.argv.includes('--local');

/**
 * Check if Docker daemon is running and responsive.
 * @returns {boolean} True if docker daemon is active
 */
function isDockerRunning() {
    try {
        const res = spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 2000 });
        return res.status === 0;
    } catch (e) {
        return false;
    }
}

const shouldRunDocker = !isInsideContainer && !forceLocal && forceDocker && isDockerRunning();

if (shouldRunDocker) {
    const projectRoot = process.cwd();

    const upRes = spawnSync('docker', ['compose', 'up', '-d', 'lorapok'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PROJECT_ROOT: projectRoot }
    });

    if (upRes.status !== 0) {
        console.warn('⚠️  Docker Compose container start failed. Falling back to local Node.js execution...');
        process.argv = process.argv.filter(arg => arg !== '--docker' && arg !== '--local');
        require('../index.js');
    } else {
        const args = [
            'compose',
            'exec',
            'lorapok',
            'node', 'index.js',
            ...process.argv.slice(2).filter(arg => arg !== '--docker')
        ];

        const docker = spawn('docker', args, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, PROJECT_ROOT: projectRoot }
        });

        docker.on('exit', (code) => {
            process.exit(code || 0);
        });

        docker.on('error', () => {
            console.warn('⚠️  Docker execution error. Falling back to local Node.js execution...');
            process.argv = process.argv.filter(arg => arg !== '--docker' && arg !== '--local');
            require('../index.js');
        });
    }
} else {
    // Standard native Node.js execution
    process.argv = process.argv.filter(arg => arg !== '--local' && arg !== '--docker');
    require('../index.js');
}