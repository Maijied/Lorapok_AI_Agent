/**
 * Empirical Test Harness for server.js
 * Verifies:
 * 1. GET /health endpoint JSON structure, status, version, credit, author, timestamp.
 * 2. Active socket tracking (connection add/remove in connections Set).
 * 3. Graceful shutdown execution, socket destruction, session clearing.
 * 4. IPC/Signal response (SIGTERM/SIGINT) in spawned child process.
 */
'use strict';

const http = require('http');
const net = require('net');
const assert = require('assert');
const { spawn } = require('child_process');
const { startServer, gracefulShutdown } = require('../../server');

let passCount = 0;
let failCount = 0;

async function runTests() {
    console.log('\n--- Empirical Testing: server.js ---\n');

    // -------------------------------------------------------------
    // Test 1: GET /health endpoint verification
    // -------------------------------------------------------------
    try {
        const testServer = startServer(0);
        const port = testServer.address().port;

        await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/health`, (res) => {
                let data = '';
                assert.strictEqual(res.statusCode, 200, 'Health endpoint should return 200 OK');
                assert.strictEqual(res.headers['content-type'].includes('application/json'), true);

                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const body = JSON.parse(data);
                        assert.strictEqual(body.status, 'ok', 'Status should be "ok"');
                        assert.strictEqual(body.name, 'lorapok-coding-agent');
                        assert.strictEqual(body.version, '1.0.0');
                        assert.strictEqual(body.credit, 'Built with 🐛 by Lorapok Labs (https://lorapok.com)');
                        assert.strictEqual(body.author, 'Lorapok Labs (https://lorapok.com)');
                        assert(body.timestamp, 'Timestamp should be present');
                        assert(!isNaN(Date.parse(body.timestamp)), 'Timestamp should be valid ISO date');
                        console.log('  ✓ GET /health returns expected schema and metadata');
                        passCount++;
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        await new Promise(res => testServer.close(res));
    } catch (err) {
        console.error('  ✗ GET /health test failed:', err.message);
        failCount++;
    }

    // -------------------------------------------------------------
    // Test 2: Active Socket Tracking & Graceful Shutdown
    // -------------------------------------------------------------
    try {
        const testServer = startServer(0);
        const port = testServer.address().port;

        // Connect 3 persistent TCP clients
        const client1 = net.connect({ port, host: '127.0.0.1' });
        const client2 = net.connect({ port, host: '127.0.0.1' });
        const client3 = net.connect({ port, host: '127.0.0.1' });

        await new Promise(resolve => setTimeout(resolve, 100)); // wait for connection setup

        let client1Closed = false;
        let client2Closed = false;
        let client3Closed = false;

        client1.on('close', () => { client1Closed = true; });
        client2.on('close', () => { client2Closed = true; });
        client3.on('close', () => { client3Closed = true; });

        // Intercept process.exit so in-process test runner doesn't exit prematurely
        const originalExit = process.exit;
        let exitCodeCalled = null;
        process.exit = (code) => {
            exitCodeCalled = code;
        };

        gracefulShutdown('SIGTERM');

        // Wait for shutdown callback
        await new Promise(resolve => setTimeout(resolve, 300));

        // Keep process.exit dummy so fallback setTimeout timer doesn't exit test process with 1
        process.exit = () => {};

        assert.strictEqual(client1Closed, true, 'Client 1 socket should be destroyed/closed during shutdown');
        assert.strictEqual(client2Closed, true, 'Client 2 socket should be destroyed/closed during shutdown');
        assert.strictEqual(client3Closed, true, 'Client 3 socket should be destroyed/closed during shutdown');
        assert.strictEqual(exitCodeCalled, 0, 'Graceful shutdown should trigger process.exit(0)');

        console.log('  ✓ Active socket tracking & graceful socket destruction verified');
        passCount++;
    } catch (err) {
        console.error('  ✗ Socket tracking & graceful shutdown test failed:', err.message);
        failCount++;
    }

    // -------------------------------------------------------------
    // Test 3: Child Process Signal Handling (SIGTERM)
    // -------------------------------------------------------------
    try {
        const child = spawn(process.execPath, ['server.js'], {
            env: { ...process.env, PORT: '3849', NODE_ENV: 'test' },
            cwd: process.cwd()
        });

        let childLogs = '';
        child.stdout.on('data', (d) => { childLogs += d.toString(); });
        child.stderr.on('data', (d) => { childLogs += d.toString(); });

        await new Promise(r => setTimeout(r, 800));

        child.kill('SIGTERM');

        const exitResult = await new Promise((resolve) => {
            const timer = setTimeout(() => resolve('TIMEOUT'), 4000);
            child.on('exit', (code, signal) => {
                clearTimeout(timer);
                resolve({ code, signal });
            });
        });

        assert.notStrictEqual(exitResult, 'TIMEOUT', 'Child process should exit within timeout upon SIGTERM');
        assert(childLogs.includes('Shutting down gracefully') || childLogs.includes('Received SIGTERM'),
            `Child log should confirm SIGTERM handling. Got:\n${childLogs}`);
        assert.strictEqual(exitResult.code, 0, 'Child exit code should be 0 on graceful shutdown');

        console.log('  ✓ Child process SIGTERM signal handling verified');
        passCount++;
    } catch (err) {
        console.error('  ✗ Child process SIGTERM test failed:', err.message);
        failCount++;
    }

    // -------------------------------------------------------------
    // Test 4: Child Process Signal Handling (SIGINT)
    // -------------------------------------------------------------
    try {
        const child = spawn(process.execPath, ['server.js'], {
            env: { ...process.env, PORT: '3850', NODE_ENV: 'test' },
            cwd: process.cwd()
        });

        let childLogs = '';
        child.stdout.on('data', (d) => { childLogs += d.toString(); });
        child.stderr.on('data', (d) => { childLogs += d.toString(); });

        await new Promise(r => setTimeout(r, 800));

        child.kill('SIGINT');

        const exitResult = await new Promise((resolve) => {
            const timer = setTimeout(() => resolve('TIMEOUT'), 4000);
            child.on('exit', (code, signal) => {
                clearTimeout(timer);
                resolve({ code, signal });
            });
        });

        assert.notStrictEqual(exitResult, 'TIMEOUT', 'Child process should exit within timeout upon SIGINT');
        assert(childLogs.includes('Shutting down gracefully') || childLogs.includes('Received SIGINT'),
            `Child log should confirm SIGINT handling. Got:\n${childLogs}`);
        assert.strictEqual(exitResult.code, 0, 'Child exit code should be 0 on graceful shutdown');

        console.log('  ✓ Child process SIGINT signal handling verified');
        passCount++;
    } catch (err) {
        console.error('  ✗ Child process SIGINT test failed:', err.message);
        failCount++;
    }

    console.log(`\nResults: ${passCount} passed, ${failCount} failed.\n`);
    if (failCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
