#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Lorapok CLI Entry Point
 * Redirects to Docker unless LORAPOK_DOCKER=true or specifically requested local execution
 */

const isDocker = process.env.LORAPOK_DOCKER === 'true';

if (isDocker) {
    // Inside Docker: Run the main application
    require('../index.js');
} else {
    // On Host: Redirect all lorapok commands to the Docker container
    const projectRoot = process.cwd();

    // Check if we are in a directory that should be mounted
    // Default to mounting current directory to /project

    const args = [
        'compose',
        'run',
        '--rm',
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