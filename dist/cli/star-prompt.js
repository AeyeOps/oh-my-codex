/**
 * One-time GitHub star prompt shown at OMX startup.
 * Skipped when no TTY or when gh CLI is not installed.
 * State stored globally (~/.omx/state/star-prompt.json) so it shows once per user.
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as childProcess from 'child_process';
import { createInterface } from 'readline/promises';
const REPO = 'Yeachan-Heo/oh-my-codex';
export function starPromptStatePath() {
    return join(homedir(), '.omx', 'state', 'star-prompt.json');
}
export async function hasBeenPrompted() {
    const path = starPromptStatePath();
    if (!existsSync(path))
        return false;
    try {
        const content = await readFile(path, 'utf-8');
        const state = JSON.parse(content);
        return typeof state.prompted_at === 'string';
    }
    catch {
        return false;
    }
}
export async function markPrompted() {
    const stateDir = join(homedir(), '.omx', 'state');
    await mkdir(stateDir, { recursive: true });
    await writeFile(starPromptStatePath(), JSON.stringify({ prompted_at: new Date().toISOString() }, null, 2));
}
export function isGhInstalled() {
    const result = childProcess.spawnSync('gh', ['--version'], {
        encoding: 'utf-8',
        stdio: ['ignore', 'ignore', 'ignore'],
        timeout: 3000,
        windowsHide: true,
    });
    return !result.error && result.status === 0;
}
export function starRepo(spawnSyncFn = childProcess.spawnSync) {
    const result = spawnSyncFn('gh', ['api', '-X', 'PUT', `/user/starred/${REPO}`], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
        windowsHide: true,
    });
    if (result.error)
        return { ok: false, error: result.error.message };
    if (result.status !== 0) {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        return { ok: false, error: stderr || stdout || `gh exited ${result.status}` };
    }
    return { ok: true };
}
async function askYesNo(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = (await rl.question(question)).trim().toLowerCase();
        return answer === '' || answer === 'y' || answer === 'yes';
    }
    finally {
        rl.close();
    }
}
export async function maybePromptGithubStar(deps = {}) {
    const stdinIsTTY = deps.stdinIsTTY ?? process.stdin.isTTY;
    const stdoutIsTTY = deps.stdoutIsTTY ?? process.stdout.isTTY;
    if (!stdinIsTTY || !stdoutIsTTY)
        return;
    const hasBeenPromptedImpl = deps.hasBeenPromptedFn ?? hasBeenPrompted;
    if (await hasBeenPromptedImpl())
        return;
    const isGhInstalledImpl = deps.isGhInstalledFn ?? isGhInstalled;
    if (!isGhInstalledImpl())
        return;
    // Mark as prompted before asking so we never prompt again even if interrupted.
    const markPromptedImpl = deps.markPromptedFn ?? markPrompted;
    await markPromptedImpl();
    const askYesNoImpl = deps.askYesNoFn ?? askYesNo;
    const approved = await askYesNoImpl('[omx] Enjoying oh-my-codex? Star it on GitHub? [Y/n] ');
    if (!approved)
        return;
    const starRepoImpl = deps.starRepoFn ?? starRepo;
    const star = starRepoImpl();
    if (star.ok) {
        const log = deps.logFn ?? console.log;
        log('[omx] Thanks for the star!');
        return;
    }
    const warn = deps.warnFn ?? console.warn;
    warn(`[omx] Could not star repository automatically: ${star.error}`);
}
//# sourceMappingURL=star-prompt.js.map