#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Lorapok CLI Entry Point
 * Redirects to Docker unless LORAPOK_DOCKER=true or specifically requested local execution
 */

const isDocker = process.env.LORAPOK_DOCKER === 'true';
const useLocal = process.argv.includes('--local');

if (isDocker || useLocal) {
    // Inside Docker or specifically requested local execution
    // Remove --local from args so it doesn't confuse commander in index.js
    if (useLocal) {
        process.argv = process.argv.filter(arg => arg !== '--local');
    }
    require('../index.js');
} else {
    // On Host: Redirect all lorapok commands to the Docker container
    const projectRoot = process.cwd();

    // 1. Ensure the persistent container is up and matches current directory
    // This will create or update the single 'lorapok-ai-agent' container
    spawnSync('docker', ['compose', 'up', '-d', 'lorapok'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PROJECT_ROOT: projectRoot }
    });

    // 2. Execute the CLI inside the existing container
    const args = [
        'compose',
        'exec',
        'lorapok',
        'node', 'index.js',
        ...process.argv.slice(2)
    ];

    const docker = spawn('docker', args, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PROJECT_ROOT: projectRoot }
    });

    docker.on('exit', (code) => {
        process.exit(code || 0);
    });

    docker.on('error', (err) => {
        console.error('❌ Failed to start Lorapok via Docker.');
        console.error('Ensure Docker and Docker Compose are installed and running.');
        console.error(err.message);
        process.exit(1);
    });
}