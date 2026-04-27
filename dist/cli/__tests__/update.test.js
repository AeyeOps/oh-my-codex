import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { isInstallVersionBump, isNewerVersion, maybeCheckAndPromptUpdate, readUserInstallStamp, resolveInstalledCliEntry, runImmediateUpdate, shouldCheckForUpdates, spawnInstalledSetupRefresh, writeUserInstallStamp, } from '../update.js';
const PACKAGE_NAME = 'oh-my-codex';
describe('isNewerVersion', () => {
    it('returns true when latest has higher major', () => {
        assert.equal(isNewerVersion('1.0.0', '2.0.0'), true);
    });
    it('returns true when latest has higher minor', () => {
        assert.equal(isNewerVersion('1.0.0', '1.1.0'), true);
    });
    it('returns true when latest has higher patch', () => {
        assert.equal(isNewerVersion('1.0.0', '1.0.1'), true);
    });
    it('returns false when versions are equal', () => {
        assert.equal(isNewerVersion('1.2.3', '1.2.3'), false);
    });
    it('returns false when current is ahead', () => {
        assert.equal(isNewerVersion('2.0.0', '1.9.9'), false);
    });
    it('returns false for invalid current version', () => {
        assert.equal(isNewerVersion('invalid', '1.0.0'), false);
    });
    it('returns false for invalid latest version', () => {
        assert.equal(isNewerVersion('1.0.0', 'invalid'), false);
    });
    it('handles v-prefixed versions', () => {
        assert.equal(isNewerVersion('v1.0.0', 'v1.0.1'), true);
    });
    it('returns false when major is lower even if minor/patch higher', () => {
        assert.equal(isNewerVersion('2.5.5', '1.9.9'), false);
    });
});
describe('shouldCheckForUpdates', () => {
    const INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h
    it('returns true when state is null', () => {
        assert.equal(shouldCheckForUpdates(Date.now(), null), true);
    });
    it('returns true when last_checked_at is missing', () => {
        assert.equal(shouldCheckForUpdates(Date.now(), {}), true);
    });
    it('returns true when last_checked_at is invalid', () => {
        assert.equal(shouldCheckForUpdates(Date.now(), { last_checked_at: 'not-a-date' }), true);
    });
    it('returns false when checked within interval', () => {
        const now = Date.now();
        const recentCheck = new Date(now - INTERVAL_MS + 1000).toISOString();
        assert.equal(shouldCheckForUpdates(now, { last_checked_at: recentCheck }), false);
    });
    it('returns true when check is overdue', () => {
        const now = Date.now();
        const oldCheck = new Date(now - INTERVAL_MS - 1000).toISOString();
        assert.equal(shouldCheckForUpdates(now, { last_checked_at: oldCheck }), true);
    });
    it('returns true when exactly at interval boundary', () => {
        const now = Date.now();
        const exactCheck = new Date(now - INTERVAL_MS).toISOString();
        assert.equal(shouldCheckForUpdates(now, { last_checked_at: exactCheck }), true);
    });
    it('respects custom interval', () => {
        const now = Date.now();
        const customInterval = 60 * 1000;
        const recentCheck = new Date(now - 30 * 1000).toISOString();
        assert.equal(shouldCheckForUpdates(now, { last_checked_at: recentCheck }, customInterval), false);
    });
});
describe('install stamp helpers', () => {
    it('treats missing prior stamp as a version bump', () => {
        assert.equal(isInstallVersionBump('0.14.0', null), true);
    });
    it('treats matching installed_version as not a bump', () => {
        assert.equal(isInstallVersionBump('0.14.0', {
            installed_version: '0.14.0',
            setup_completed_version: '0.14.0',
            updated_at: '2026-04-20T00:00:00.000Z',
        }), false);
    });
    it('writes and reads the user-scope install stamp schema', async () => {
        const root = await mkdtemp(join(tmpdir(), 'omx-install-stamp-'));
        const stampPath = join(root, '.codex', '.omx', 'install-state.json');
        try {
            await writeUserInstallStamp({
                installed_version: '0.14.0',
                setup_completed_version: '0.14.0',
                updated_at: '2026-04-20T00:00:00.000Z',
            }, stampPath);
            const parsed = await readUserInstallStamp(stampPath);
            assert.deepEqual(parsed, {
                installed_version: '0.14.0',
                setup_completed_version: '0.14.0',
                updated_at: '2026-04-20T00:00:00.000Z',
            });
        }
        finally {
            await rm(root, { recursive: true, force: true });
        }
    });
});
describe('maybeCheckAndPromptUpdate', () => {
    async function withInteractiveTty(run) {
        const originalStdinTty = process.stdin.isTTY;
        const originalStdoutTty = process.stdout.isTTY;
        Object.defineProperty(process.stdin, 'isTTY', {
            configurable: true,
            value: true,
        });
        Object.defineProperty(process.stdout, 'isTTY', {
            configurable: true,
            value: true,
        });
        try {
            await run();
        }
        finally {
            Object.defineProperty(process.stdin, 'isTTY', {
                configurable: true,
                value: originalStdinTty,
            });
            Object.defineProperty(process.stdout, 'isTTY', {
                configurable: true,
                value: originalStdoutTty,
            });
        }
    }
    it('prints fork-managed guidance instead of checking npm at launch time', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-'));
        const statePath = join(cwd, '.omx', 'state', 'update-check.json');
        const originalLog = console.log;
        const logs = [];
        let latestCalls = 0;
        let updateAttempts = 0;
        let setupRefreshCalls = 0;
        console.log = (...args) => {
            logs.push(args.map((arg) => String(arg)).join(' '));
        };
        try {
            await withInteractiveTty(async () => {
                await maybeCheckAndPromptUpdate(cwd, {
                    getCurrentVersion: async () => '0.15.0',
                    fetchLatestVersion: async () => {
                        latestCalls += 1;
                        return '9.9.9';
                    },
                    runGlobalUpdate: () => {
                        updateAttempts += 1;
                        return { ok: true, stderr: '' };
                    },
                    runSetupRefresh: async () => {
                        setupRefreshCalls += 1;
                        return { ok: true, stderr: '' };
                    },
                });
            });
            assert.equal(latestCalls, 0);
            assert.equal(updateAttempts, 0);
            assert.equal(setupRefreshCalls, 0);
            assert.match(logs.join('\n'), /public-npm auto-update is disabled/);
            const state = JSON.parse(await readFile(statePath, 'utf-8'));
            assert.equal(state.last_seen_latest, 'fork-managed');
        }
        finally {
            console.log = originalLog;
            await rm(cwd, { recursive: true, force: true });
        }
    });
    it('respects the passive launch-time cadence before printing fork guidance', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-'));
        const statePath = join(cwd, '.omx', 'state', 'update-check.json');
        const originalLog = console.log;
        const logs = [];
        let currentCalls = 0;
        console.log = (...args) => {
            logs.push(args.map((arg) => String(arg)).join(' '));
        };
        try {
            await mkdir(join(cwd, '.omx', 'state'), { recursive: true });
            await writeFile(statePath, JSON.stringify({
                last_checked_at: new Date().toISOString(),
                last_seen_latest: 'fork-managed',
            }, null, 2));
            await withInteractiveTty(async () => {
                await maybeCheckAndPromptUpdate(cwd, {
                    getCurrentVersion: async () => {
                        currentCalls += 1;
                        return '0.15.0';
                    },
                });
            });
            assert.equal(currentCalls, 0);
            assert.equal(logs.length, 0);
        }
        finally {
            console.log = originalLog;
            await rm(cwd, { recursive: true, force: true });
        }
    });
});
describe('runImmediateUpdate', () => {
    it('prints fork-managed update commands and does not call public npm update', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-now-'));
        const statePath = join(cwd, '.omx', 'state', 'update-check.json');
        const originalLog = console.log;
        const logs = [];
        let latestCalls = 0;
        let updateCalls = 0;
        let refreshCalls = 0;
        console.log = (...args) => {
            logs.push(args.map((arg) => String(arg)).join(' '));
        };
        try {
            const result = await runImmediateUpdate(cwd, {
                getCurrentVersion: async () => '0.15.0',
                fetchLatestVersion: async () => {
                    latestCalls += 1;
                    return '9.9.9';
                },
                runGlobalUpdate: () => {
                    updateCalls += 1;
                    return { ok: true, stderr: '' };
                },
                runSetupRefresh: async () => {
                    refreshCalls += 1;
                    return { ok: true, stderr: '' };
                },
            });
            assert.equal(result.status, 'disabled');
            assert.equal(result.currentVersion, '0.15.0');
            assert.equal(result.latestVersion, null);
            assert.equal(latestCalls, 0);
            assert.equal(updateCalls, 0);
            assert.equal(refreshCalls, 0);
            const output = logs.join('\n');
            assert.match(output, /codex plugin marketplace upgrade oh-my-codex-local/);
            assert.match(output, /codex plugin marketplace add AeyeOps\/oh-my-codex/);
            assert.match(output, /npm install -g \./);
            assert.doesNotMatch(output, /npm install -g oh-my-codex@latest/);
            const state = JSON.parse(await readFile(statePath, 'utf-8'));
            assert.equal(state.last_seen_latest, 'fork-managed');
        }
        finally {
            console.log = originalLog;
            await rm(cwd, { recursive: true, force: true });
        }
    });
});
describe('post-update setup refresh handoff', () => {
    it('uses the installed package bin entry when resolving the refreshed CLI', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-bin-contract-'));
        const globalRoot = join(cwd, 'global-root');
        const packageRoot = join(globalRoot, PACKAGE_NAME);
        const cliRelativePath = join('dist', 'custom', 'omx-entry.js');
        const cliEntry = join(packageRoot, cliRelativePath);
        try {
            await mkdir(dirname(cliEntry), { recursive: true });
            await writeFile(join(packageRoot, 'package.json'), JSON.stringify({ name: PACKAGE_NAME, version: '0.14.1', bin: { omx: cliRelativePath } }, null, 2));
            await writeFile(cliEntry, '#!/usr/bin/env node\n');
            assert.equal(await resolveInstalledCliEntry(globalRoot), cliEntry);
        }
        finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });
    it('falls back to the current published CLI layout when package metadata is unavailable', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-bin-fallback-'));
        const globalRoot = join(cwd, 'global-root');
        const cliEntry = join(globalRoot, PACKAGE_NAME, 'dist', 'cli', 'omx.js');
        try {
            await mkdir(dirname(cliEntry), { recursive: true });
            await writeFile(cliEntry, '#!/usr/bin/env node\n');
            assert.equal(await resolveInstalledCliEntry(globalRoot), cliEntry);
        }
        finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });
    it('returns null when neither package bin nor fallback CLI entry exists', async () => {
        const cwd = await mkdtemp(join(tmpdir(), 'omx-update-bin-missing-'));
        try {
            assert.equal(await resolveInstalledCliEntry(join(cwd, 'global-root')), null);
        }
        finally {
            await rm(cwd, { recursive: true, force: true });
        }
    });
    it('does not impose a timeout on the interactive setup refresh handoff', () => {
        let receivedTimeout = Symbol('unset');
        const result = spawnInstalledSetupRefresh('/tmp/omx.js', '/tmp/project', ((_command, _args, options) => {
            receivedTimeout = options?.timeout;
            return { status: 0, error: undefined };
        }));
        assert.equal(result.ok, true);
        assert.equal(receivedTimeout, undefined);
    });
});
//# sourceMappingURL=update.test.js.map