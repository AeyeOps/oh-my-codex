import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
const STARTUP_SETTLE_MS = 150;
const SPAWN_TIMEOUT_MS = 1_500;
const EXIT_TIMEOUT_MS = 2_500;
const OUTPUT_LIMIT = 4_096;
const IDLE_ENTRYPOINTS = [
    { server: 'state', file: 'state-server.js' },
    { server: 'memory', file: 'memory-server.js' },
    { server: 'code_intel', file: 'code-intel-server.js' },
    { server: 'trace', file: 'trace-server.js' },
];
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function trimOutput(chunks) {
    const text = chunks.join('');
    if (text.length <= OUTPUT_LIMIT)
        return text;
    return text.slice(-OUTPUT_LIMIT);
}
function isChildAlive(child) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
        return false;
    }
    try {
        process.kill(child.pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
function formatFailureContext(entrypoint, stderr, stdout) {
    const note = 'caveat' in entrypoint ? ` (${entrypoint.caveat})` : '';
    return [
        `${entrypoint.server}${note}`,
        `stdout=${JSON.stringify(trimOutput(stdout))}`,
        `stderr=${JSON.stringify(trimOutput(stderr))}`,
    ].join(' | ');
}
async function waitForSpawn(child, entrypoint, stderr, stdout) {
    await Promise.race([
        once(child, 'spawn').then(() => undefined),
        once(child, 'error').then(([error]) => {
            throw new Error(`failed to spawn ${formatFailureContext(entrypoint, stderr, stdout)}: ${error.message}`);
        }),
        delay(SPAWN_TIMEOUT_MS).then(() => {
            throw new Error(`timed out waiting for spawn: ${formatFailureContext(entrypoint, stderr, stdout)}`);
        }),
    ]);
}
async function assertChildAliveBeforeTeardown(child, entrypoint, stderr, stdout) {
    await delay(STARTUP_SETTLE_MS);
    assert.equal(isChildAlive(child), true, `child must still be alive before teardown assertion: ${formatFailureContext(entrypoint, stderr, stdout)}`);
}
async function waitForExit(child, entrypoint, stderr, stdout) {
    if (child.exitCode !== null || child.signalCode !== null) {
        return { code: child.exitCode, signal: child.signalCode };
    }
    try {
        const [code, signal] = (await Promise.race([
            once(child, 'exit'),
            delay(EXIT_TIMEOUT_MS).then(() => {
                throw new Error(`timed out waiting for exit: ${formatFailureContext(entrypoint, stderr, stdout)}`);
            }),
        ]));
        return { code, signal };
    }
    catch (error) {
        child.kill('SIGKILL');
        throw error;
    }
}
function spawnEntrypoint(entrypoint) {
    const child = spawn(process.execPath, [join(process.cwd(), 'dist', 'mcp', entrypoint.file)], {
        cwd: process.cwd(),
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => stdout.push(chunk));
    child.stderr?.on('data', (chunk) => stderr.push(chunk));
    return { child, stdout, stderr };
}
async function forceCleanup(child) {
    if (!isChildAlive(child))
        return;
    child.kill('SIGKILL');
    await once(child, 'exit').catch(() => { });
}
async function waitForCondition(predicate, timeoutMs, message) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (predicate())
            return;
        await delay(25);
    }
    if (!predicate())
        throw new Error(message);
}
describe('MCP stdio lifecycle runtime regression (built entrypoints)', () => {
    for (const entrypoint of IDLE_ENTRYPOINTS) {
        const label = 'caveat' in entrypoint
            ? `${entrypoint.server} idle entrypoint exits after stdin closes (${entrypoint.caveat})`
            : `${entrypoint.server} idle entrypoint exits after stdin closes`;
        it(label, async () => {
            const { child, stderr, stdout } = spawnEntrypoint(entrypoint);
            try {
                await waitForSpawn(child, entrypoint, stderr, stdout);
                await assertChildAliveBeforeTeardown(child, entrypoint, stderr, stdout);
                child.stdin?.end();
                const exit = await waitForExit(child, entrypoint, stderr, stdout);
                assert.notEqual(exit.signal, 'SIGKILL');
                assert.equal(isChildAlive(child), false);
            }
            finally {
                await forceCleanup(child);
            }
        });
    }
    for (const entrypoint of IDLE_ENTRYPOINTS) {
        const label = 'caveat' in entrypoint
            ? `${entrypoint.server} idle entrypoint exits on SIGTERM (${entrypoint.caveat})`
            : `${entrypoint.server} idle entrypoint exits on SIGTERM`;
        it(label, async () => {
            const { child, stderr, stdout } = spawnEntrypoint(entrypoint);
            try {
                await waitForSpawn(child, entrypoint, stderr, stdout);
                await assertChildAliveBeforeTeardown(child, entrypoint, stderr, stdout);
                child.kill('SIGTERM');
                const exit = await waitForExit(child, entrypoint, stderr, stdout);
                assert.notEqual(exit.signal, 'SIGKILL');
                assert.equal(isChildAlive(child), false);
            }
            finally {
                await forceCleanup(child);
            }
        });
    }
    for (const entrypoint of IDLE_ENTRYPOINTS) {
        const label = 'caveat' in entrypoint
            ? `${entrypoint.server} idle entrypoint exits on SIGINT (${entrypoint.caveat})`
            : `${entrypoint.server} idle entrypoint exits on SIGINT`;
        it(label, async () => {
            const { child, stderr, stdout } = spawnEntrypoint(entrypoint);
            try {
                await waitForSpawn(child, entrypoint, stderr, stdout);
                await assertChildAliveBeforeTeardown(child, entrypoint, stderr, stdout);
                child.kill('SIGINT');
                const exit = await waitForExit(child, entrypoint, stderr, stdout);
                assert.notEqual(exit.signal, 'SIGKILL');
                assert.equal(isChildAlive(child), false);
            }
            finally {
                await forceCleanup(child);
            }
        });
    }
    it('older duplicate entrypoints self-exit after post-duplicate idle while the newest sibling survives', async () => {
        const entrypoint = IDLE_ENTRYPOINTS[0];
        const sharedEnv = {
            ...process.env,
            OMX_MCP_PARENT_WATCHDOG_INTERVAL_MS: '250',
            OMX_MCP_DUPLICATE_SIBLING_WATCHDOG_INTERVAL_MS: '250',
            OMX_MCP_DUPLICATE_SIBLING_POST_TRAFFIC_IDLE_MS: '750',
        };
        const older = spawn(process.execPath, [join(process.cwd(), 'dist', 'mcp', entrypoint.file)], {
            cwd: process.cwd(),
            env: sharedEnv,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let newer = null;
        const stdout = [];
        const stderr = [];
        const attachLogs = (child) => {
            child.stdout?.setEncoding('utf8');
            child.stderr?.setEncoding('utf8');
            child.stdout?.on('data', (chunk) => stdout.push(chunk));
            child.stderr?.on('data', (chunk) => stderr.push(chunk));
        };
        attachLogs(older);
        try {
            await waitForSpawn(older, entrypoint, stderr, stdout);
            await assertChildAliveBeforeTeardown(older, entrypoint, stderr, stdout);
            older.stdin?.write('pre-duplicate-traffic');
            await delay(100);
            newer = spawn(process.execPath, [join(process.cwd(), 'dist', 'mcp', entrypoint.file)], {
                cwd: process.cwd(),
                env: sharedEnv,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            attachLogs(newer);
            await waitForSpawn(newer, entrypoint, stderr, stdout);
            await assertChildAliveBeforeTeardown(newer, entrypoint, stderr, stdout);
            await delay(400);
            older.stdin?.write('post-duplicate-traffic');
            await waitForCondition(() => !isChildAlive(older), 2_500, `older duplicate failed to self-exit: ${formatFailureContext(entrypoint, stderr, stdout)}`);
            assert.equal(isChildAlive(newer), true, `newest duplicate should survive: ${formatFailureContext(entrypoint, stderr, stdout)}`);
            const olderExit = await waitForExit(older, entrypoint, stderr, stdout);
            assert.notEqual(olderExit.signal, 'SIGKILL');
        }
        finally {
            await forceCleanup(older);
            if (newer) {
                await forceCleanup(newer);
            }
        }
    });
});
//# sourceMappingURL=server-lifecycle.test.js.map