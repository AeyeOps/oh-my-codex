/**
 * Update orchestration for oh-my-codex.
 *
 * AeyeOps fork policy disables the built-in public-npm update path.
 * The launch-time checker and explicit `omx update` command now return
 * fork-managed update guidance instead of checking or installing npm latest.
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';
import { createInterface } from 'readline/promises';
import { getPackageRoot } from '../utils/package.js';
import { omxUserInstallStampPath } from '../utils/paths.js';
const PACKAGE_NAME = 'oh-my-codex';
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h
const FORK_MARKETPLACE_NAME = 'oh-my-codex-local';
const FORK_REPOSITORY = 'AeyeOps/oh-my-codex';
export const FORK_UPDATE_GUIDANCE_LINES = [
    '[omx] Built-in public-npm update is disabled for this fork-managed OMX install.',
    '[omx] Update Codex plugin marketplace metadata, skills, MCP metadata, and apps from the fork:',
    `  codex plugin marketplace upgrade ${FORK_MARKETPLACE_NAME}`,
    '[omx] If this machine is still pointed at upstream, rewire it once with:',
    `  codex plugin marketplace remove ${FORK_MARKETPLACE_NAME}`,
    `  codex plugin marketplace add ${FORK_REPOSITORY}`,
    '[omx] Update the global OMX runtime from a local fork checkout:',
    '  cd <oh-my-codex-fork-checkout>',
    '  git pull --ff-only origin main',
    '  npm ci',
    '  npm run compile',
    '  npm install -g .',
    '  omx setup',
    '[omx] Restart Codex after refreshing plugin or runtime surfaces.',
];
function useForkManagedUpdates() {
    return process.env.OMX_ENABLE_PUBLIC_NPM_UPDATE !== '1';
}
function logForkUpdateGuidance(immediate) {
    if (immediate) {
        for (const line of FORK_UPDATE_GUIDANCE_LINES)
            console.log(line);
        return;
    }
    console.log('[omx] Built-in public-npm auto-update is disabled for this fork-managed OMX install. Run `omx update` for fork update commands.');
}
function parseSemver(version) {
    const m = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!m)
        return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}
export function isNewerVersion(current, latest) {
    const c = parseSemver(current);
    const l = parseSemver(latest);
    if (!c || !l)
        return false;
    if (l[0] !== c[0])
        return l[0] > c[0];
    if (l[1] !== c[1])
        return l[1] > c[1];
    return l[2] > c[2];
}
export function shouldCheckForUpdates(nowMs, state, intervalMs = CHECK_INTERVAL_MS) {
    if (!state?.last_checked_at)
        return true;
    const last = Date.parse(state.last_checked_at);
    if (!Number.isFinite(last))
        return true;
    return (nowMs - last) >= intervalMs;
}
function updateStatePath(cwd) {
    return join(cwd, '.omx', 'state', 'update-check.json');
}
async function readUpdateState(cwd) {
    const path = updateStatePath(cwd);
    if (!existsSync(path))
        return null;
    try {
        const content = await readFile(path, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
async function writeUpdateState(cwd, state) {
    const stateDir = join(cwd, '.omx', 'state');
    await mkdir(stateDir, { recursive: true });
    await writeFile(updateStatePath(cwd), JSON.stringify(state, null, 2));
}
async function fetchLatestVersion(timeoutMs = 3500) {
    const registryUrl = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(registryUrl, { signal: controller.signal });
        if (!res.ok)
            return null;
        const body = await res.json();
        return typeof body.version === 'string' ? body.version : null;
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timer);
    }
}
async function getCurrentVersion() {
    try {
        const pkgPath = join(getPackageRoot(), 'package.json');
        const content = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);
        return typeof pkg.version === 'string' ? pkg.version : null;
    }
    catch {
        return null;
    }
}
function runGlobalUpdate() {
    const result = spawnSync('npm', ['install', '-g', `${PACKAGE_NAME}@latest`], {
        encoding: 'utf-8',
        stdio: ['ignore', 'ignore', 'pipe'],
        timeout: 120000,
        windowsHide: true,
    });
    if (result.error) {
        return { ok: false, stderr: result.error.message };
    }
    if (result.status !== 0) {
        return { ok: false, stderr: (result.stderr || '').trim() || `npm exited ${result.status}` };
    }
    return { ok: true, stderr: '' };
}
async function askYesNo(question) {
    if (!process.stdin.isTTY || !process.stdout.isTTY)
        return false;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = (await rl.question(question)).trim().toLowerCase();
        return answer === '' || answer === 'y' || answer === 'yes';
    }
    finally {
        rl.close();
    }
}
const defaultUpdateDependencies = {
    askYesNo,
    fetchLatestVersion,
    getCurrentVersion,
    readUserInstallStamp,
    runGlobalUpdate,
    runSetupRefresh,
    writeUpdateState,
};
function stripLeadingV(version) {
    return version.trim().replace(/^v/i, '');
}
async function writeSuccessfulInstallStamp(installedVersion) {
    await writeUserInstallStamp({
        installed_version: stripLeadingV(installedVersion),
        setup_completed_version: stripLeadingV(installedVersion),
        updated_at: new Date().toISOString(),
    });
}
export async function readUserInstallStamp(path = omxUserInstallStampPath()) {
    if (!existsSync(path))
        return null;
    try {
        const content = await readFile(path, 'utf-8');
        const parsed = JSON.parse(content);
        if (typeof parsed.installed_version !== 'string' || typeof parsed.updated_at !== 'string') {
            return null;
        }
        return {
            installed_version: parsed.installed_version,
            ...(typeof parsed.setup_completed_version === 'string'
                ? { setup_completed_version: parsed.setup_completed_version }
                : {}),
            updated_at: parsed.updated_at,
        };
    }
    catch {
        return null;
    }
}
export async function writeUserInstallStamp(stamp, path = omxUserInstallStampPath()) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(stamp, null, 2));
}
export function isInstallVersionBump(currentVersion, stamp) {
    if (!currentVersion)
        return false;
    if (!stamp?.installed_version)
        return true;
    return stripLeadingV(currentVersion) !== stripLeadingV(stamp.installed_version);
}
function doesSetupStampMatchVersion(currentVersion, stamp) {
    return stripLeadingV(stamp?.setup_completed_version ?? '') === stripLeadingV(currentVersion);
}
function resolveGlobalInstallRoot() {
    const result = spawnSync('npm', ['root', '-g'], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 15000,
        windowsHide: true,
    });
    if (result.error || result.status !== 0) {
        return null;
    }
    const root = (result.stdout || '').trim();
    return root === '' ? null : root;
}
export async function resolveInstalledCliEntry(globalInstallRoot) {
    const packageRoot = join(globalInstallRoot, PACKAGE_NAME);
    const packageJsonPath = join(packageRoot, 'package.json');
    let cliRelativePath = join('dist', 'cli', 'omx.js');
    try {
        const content = await readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        if (typeof pkg.bin === 'string' && pkg.bin.trim() !== '') {
            cliRelativePath = pkg.bin;
        }
        else if (pkg.bin &&
            typeof pkg.bin === 'object' &&
            typeof pkg.bin.omx === 'string' &&
            pkg.bin.omx.trim() !== '') {
            cliRelativePath = pkg.bin.omx;
        }
    }
    catch {
        // Fall back to the published contract used in package.json today.
    }
    const cliEntry = join(packageRoot, cliRelativePath);
    return existsSync(cliEntry) ? cliEntry : null;
}
export function spawnInstalledSetupRefresh(cliEntry, cwd, spawnProcess = spawnSync) {
    const result = spawnProcess(process.execPath, [cliEntry, 'setup'], {
        cwd,
        env: process.env,
        stdio: 'inherit',
        windowsHide: true,
    });
    if (result.error) {
        return { ok: false, stderr: result.error.message };
    }
    if (result.status !== 0) {
        return {
            ok: false,
            stderr: `The updated setup refresh exited with status ${result.status}.`,
        };
    }
    return { ok: true, stderr: '' };
}
async function runSetupRefresh(cwd) {
    const globalInstallRoot = resolveGlobalInstallRoot();
    if (!globalInstallRoot) {
        return {
            ok: false,
            stderr: 'Unable to resolve the npm global install root after updating.',
        };
    }
    const cliEntry = await resolveInstalledCliEntry(globalInstallRoot);
    if (!cliEntry) {
        return {
            ok: false,
            stderr: `Unable to find the updated OMX CLI entry under ${join(globalInstallRoot, PACKAGE_NAME)}.`,
        };
    }
    return spawnInstalledSetupRefresh(cliEntry, cwd);
}
async function executeUpdate(options) {
    const { cwd, dependencies, prompt, immediate, nowMs = Date.now() } = options;
    if (useForkManagedUpdates()) {
        const current = await dependencies.getCurrentVersion();
        try {
            await dependencies.writeUpdateState(cwd, {
                last_checked_at: new Date(nowMs).toISOString(),
                last_seen_latest: 'fork-managed',
            });
        }
        catch {
            // Update-check state is advisory only. Do not fail explicit update guidance
            // just because the current working directory is read-only or unavailable.
        }
        logForkUpdateGuidance(immediate);
        return { status: 'disabled', currentVersion: current, latestVersion: null };
    }
    const [current, latest] = await Promise.all([
        dependencies.getCurrentVersion(),
        dependencies.fetchLatestVersion(),
    ]);
    try {
        await dependencies.writeUpdateState(cwd, {
            last_checked_at: new Date(nowMs).toISOString(),
            last_seen_latest: latest ?? undefined,
        });
    }
    catch {
        // Update-check state is advisory only. Do not fail installs or explicit updates
        // just because the current working directory is read-only or unavailable.
    }
    if (!current || !latest) {
        if (immediate) {
            console.log('[omx] Unable to determine the latest oh-my-codex version. Try again later.');
        }
        return { status: 'unavailable', currentVersion: current, latestVersion: latest };
    }
    if (!isNewerVersion(current, latest)) {
        if (immediate) {
            const installStamp = await dependencies.readUserInstallStamp();
            if (!doesSetupStampMatchVersion(current, installStamp)) {
                console.log(`[omx] oh-my-codex is already up to date (v${current}). Running setup refresh...`);
                const setupRefreshResult = await dependencies.runSetupRefresh(cwd);
                if (!setupRefreshResult.ok) {
                    console.log(`[omx] Update installed, but the setup refresh failed. Run \`omx setup\` with the new install. (${setupRefreshResult.stderr})`);
                    return { status: 'failed', currentVersion: current, latestVersion: latest };
                }
                await writeSuccessfulInstallStamp(current);
                console.log(`[omx] Setup refresh completed for v${current}. Restart to use current code.`);
                return { status: 'up-to-date', currentVersion: current, latestVersion: latest };
            }
        }
        if (immediate) {
            console.log(`[omx] oh-my-codex is already up to date (v${current}).`);
        }
        return { status: 'up-to-date', currentVersion: current, latestVersion: latest };
    }
    if (prompt) {
        const approved = await dependencies.askYesNo(`[omx] Update available: v${current} → v${latest}. Update now? [Y/n] `);
        if (!approved) {
            return { status: 'declined', currentVersion: current, latestVersion: latest };
        }
    }
    console.log(`[omx] Running: npm install -g ${PACKAGE_NAME}@latest`);
    const result = dependencies.runGlobalUpdate();
    if (!result.ok) {
        console.log('[omx] Update failed. Run manually: npm install -g oh-my-codex@latest');
        return { status: 'failed', currentVersion: current, latestVersion: latest };
    }
    const setupRefreshResult = await dependencies.runSetupRefresh(cwd);
    if (!setupRefreshResult.ok) {
        console.log(`[omx] Update installed, but the setup refresh failed. Run \`omx setup\` with the new install. (${setupRefreshResult.stderr})`);
        return { status: 'failed', currentVersion: current, latestVersion: latest };
    }
    await writeSuccessfulInstallStamp(latest);
    console.log(`[omx] Updated to v${latest}. Restart to use new code.`);
    return { status: 'updated', currentVersion: current, latestVersion: latest };
}
export async function runImmediateUpdate(cwd = process.cwd(), dependencies = {}) {
    const updateDependencies = { ...defaultUpdateDependencies, ...dependencies };
    return executeUpdate({
        cwd,
        dependencies: updateDependencies,
        prompt: false,
        immediate: true,
    });
}
export async function maybeCheckAndPromptUpdate(cwd, dependencies = {}) {
    const updateDependencies = { ...defaultUpdateDependencies, ...dependencies };
    if (process.env.OMX_AUTO_UPDATE === '0')
        return;
    if (!process.stdin.isTTY || !process.stdout.isTTY)
        return;
    const now = Date.now();
    const state = await readUpdateState(cwd);
    if (!shouldCheckForUpdates(now, state))
        return;
    await executeUpdate({
        cwd,
        dependencies: updateDependencies,
        prompt: true,
        immediate: false,
        nowMs: now,
    });
}
//# sourceMappingURL=update.js.map