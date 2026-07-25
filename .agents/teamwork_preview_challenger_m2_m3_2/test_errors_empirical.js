/**
 * Empirical Test Harness for lib/errors.js
 */
'use strict';

const assert = require('assert');
const {
    LorapokError,
    APIError,
    ValidationError,
    FileSystemError,
    GitError,
    ErrorBoundary
} = require('../../lib/errors');

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

async function asyncTest(description, fn) {
    try {
        await fn();
        console.log(`  ✓ ${description}`);
        passCount++;
    } catch (err) {
        console.error(`  ✗ ${description}`);
        console.error(`    ${err.stack || err}`);
        failCount++;
    }
}

async function run() {
    console.log('\n--- Empirical Testing: lib/errors.js ---\n');

    test('LorapokError defaults and inheritance', () => {
        const err = new LorapokError('Base error');
        assert(err instanceof Error, 'Should inherit from Error');
        assert(err instanceof LorapokError, 'Should be instance of LorapokError');
        assert.strictEqual(err.name, 'LorapokError');
        assert.strictEqual(err.message, 'Base error');
        assert.strictEqual(err.code, 'INTERNAL_ERROR');
        assert.strictEqual(err.details, null);
        assert(err.timestamp, 'Timestamp should exist');
        assert(!isNaN(Date.parse(err.timestamp)), 'Timestamp should be valid ISO date');
        assert(err.stack, 'Stack trace should be captured');
    });

    test('LorapokError custom code and details', () => {
        const detailsObj = { foo: 'bar' };
        const err = new LorapokError('Custom error', 'CUSTOM_CODE', detailsObj);
        assert.strictEqual(err.code, 'CUSTOM_CODE');
        assert.strictEqual(err.details, detailsObj);
    });

    test('APIError defaults and properties', () => {
        const err = new APIError('Server error');
        assert(err instanceof LorapokError);
        assert(err instanceof Error);
        assert.strictEqual(err.name, 'APIError');
        assert.strictEqual(err.code, 'API_ERROR');
        assert.strictEqual(err.statusCode, 500);
        assert.strictEqual(err.endpoint, '');
        assert.deepStrictEqual(err.details, { statusCode: 500, endpoint: '' });
    });

    test('APIError custom status code and endpoint', () => {
        const err = new APIError('Not Found', 404, '/api/users');
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.endpoint, '/api/users');
        assert.deepStrictEqual(err.details, { statusCode: 404, endpoint: '/api/users' });
    });

    test('ValidationError defaults and properties', () => {
        const err = new ValidationError('Invalid input', 'email');
        assert(err instanceof LorapokError);
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.code, 'VALIDATION_ERROR');
        assert.strictEqual(err.field, 'email');
        assert.deepStrictEqual(err.details, { field: 'email' });
    });

    test('FileSystemError defaults and properties', () => {
        const err = new FileSystemError('File not found', '/tmp/foo.txt');
        assert(err instanceof LorapokError);
        assert.strictEqual(err.name, 'FileSystemError');
        assert.strictEqual(err.code, 'FILE_SYSTEM_ERROR');
        assert.strictEqual(err.path, '/tmp/foo.txt');
        assert.deepStrictEqual(err.details, { path: '/tmp/foo.txt' });
    });

    test('GitError defaults and properties', () => {
        const err = new GitError('Merge conflict', 'git merge main');
        assert(err instanceof LorapokError);
        assert.strictEqual(err.name, 'GitError');
        assert.strictEqual(err.code, 'GIT_ERROR');
        assert.strictEqual(err.command, 'git merge main');
        assert.deepStrictEqual(err.details, { command: 'git merge main' });
    });

    await asyncTest('ErrorBoundary.wrap successful execution', async () => {
        const successFn = async (a, b) => a + b;
        const wrapped = ErrorBoundary.wrap(successFn);
        const res = await wrapped(5, 10);
        assert.deepStrictEqual(res, { success: true, data: 15 });
    });

    await asyncTest('ErrorBoundary.wrap catching LorapokError subclasses', async () => {
        const failFn = async () => {
            throw new ValidationError('Email missing', 'email');
        };
        const wrapped = ErrorBoundary.wrap(failFn);
        const res = await wrapped();
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.error, 'Email missing');
        assert.strictEqual(res.code, 'VALIDATION_ERROR');
        assert.deepStrictEqual(res.details, { field: 'email' });
    });

    await asyncTest('ErrorBoundary.wrap catching standard native Error', async () => {
        const failFn = async () => {
            throw new Error('Standard JavaScript Error');
        };
        const wrapped = ErrorBoundary.wrap(failFn);
        const res = await wrapped();
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.error, 'Standard JavaScript Error');
        assert.strictEqual(res.code, 'INTERNAL_ERROR');
        assert.strictEqual(res.details, null);
    });

    await asyncTest('ErrorBoundary.wrap catching primitive thrown values', async () => {
        const failFn = async () => {
            throw 'String failure';
        };
        const wrapped = ErrorBoundary.wrap(failFn);
        const res = await wrapped();
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.error, 'String failure');
        assert.strictEqual(res.code, 'INTERNAL_ERROR');
    });

    console.log(`\nResults: ${passCount} passed, ${failCount} failed.\n`);
    if (failCount > 0) {
        process.exit(1);
    }
}

run();
