/**
 * OMX HUD - CLI entry point
 *
 * Usage:
 *   omx hud              Show current HUD state
 *   omx hud --watch      Poll every 1s with terminal clear
 *   omx hud --json       Output raw state as JSON
 *   omx hud --preset=X   Use preset: minimal, focused, full
 *   omx hud --tmux       Open HUD in a tmux split pane (auto-detects orientation)
 */
import { execFileSync } from 'child_process';
import { readAllState, readHudConfig } from './state.js';
import { renderHud } from './render.js';
import { HUD_TMUX_HEIGHT_LINES, HUD_TMUX_MAX_HEIGHT_LINES } from './constants.js';
import { sleep } from '../utils/sleep.js';
import { runHudAuthorityTick } from './authority.js';
import { resolveOmxCliEntryPath } from '../utils/paths.js';
export const HUD_USAGE = [
    'Usage:',
    '  omx hud              Show current HUD state',
    '  omx hud --watch      Poll every 1s with terminal clear',
    '  omx hud --json       Output raw state as JSON',
    '  omx hud --preset=X   Use preset: minimal, focused, full',
    '  omx hud --tmux       Open HUD in a tmux split pane (auto-detects orientation)',
].join('\n');
export async function watchRenderLoop(render, options = {}) {
    const intervalMs = Math.max(0, options.intervalMs ?? 1000);
    const sleepFn = options.sleepFn ?? sleep;
    const signal = options.signal;
    while (!signal?.aborted) {
        const startedAt = Date.now();
        try {
            await render();
        }
        catch (error) {
            options.onError?.(error);
        }
        if (signal?.aborted)
            return;
        const elapsedMs = Date.now() - startedAt;
        await sleepFn(Math.max(0, intervalMs - elapsedMs), signal).catch(() => { });
    }
}
/**
 * Backward-compatible watch mode runner used by tests.
 */
export async function runWatchMode(cwd, flags, deps = {}) {
    if (!flags.watch)
        return;
    const dependencies = {
        isTTY: deps.isTTY ?? Boolean(process.stdout.isTTY),
        env: deps.env ?? process.env,
        readAllStateFn: deps.readAllStateFn ?? readAllState,
        readHudConfigFn: deps.readHudConfigFn ?? readHudConfig,
        renderHudFn: deps.renderHudFn ?? renderHud,
        runAuthorityTickFn: deps.runAuthorityTickFn ?? (async ({ cwd: authorityCwd }) => {
            await runHudAuthorityTick({ cwd: authorityCwd });
        }),
        writeStdout: deps.writeStdout ?? ((text) => process.stdout.write(text)),
        writeStderr: deps.writeStderr ?? ((text) => process.stderr.write(text)),
        registerSigint: deps.registerSigint ?? ((handler) => process.on('SIGINT', handler)),
        setIntervalFn: deps.setIntervalFn ?? ((handler, intervalMs) => setInterval(handler, intervalMs)),
        clearIntervalFn: deps.clearIntervalFn ?? ((timer) => clearInterval(timer)),
    };
    if (!dependencies.isTTY && !dependencies.env.CI) {
        dependencies.writeStderr('HUD watch mode requires a TTY\n');
        process.exitCode = 1;
        return;
    }
    dependencies.writeStdout('\x1b[?25l');
    let firstRender = true;
    let inFlight = false;
    let queued = false;
    let stopped = false;
    let timer;
    let resolveDone = () => { };
    const done = new Promise((resolve) => {
        resolveDone = resolve;
    });
    const stop = () => {
        if (stopped)
            return;
        stopped = true;
        if (timer)
            dependencies.clearIntervalFn(timer);
        dependencies.writeStdout('\x1b[?25h\x1b[2J\x1b[H');
        resolveDone();
    };
    const renderTick = async () => {
        if (stopped)
            return;
        if (inFlight) {
            queued = true;
            return;
        }
        inFlight = true;
        try {
            if (firstRender) {
                dependencies.writeStdout('\x1b[2J\x1b[H');
                firstRender = false;
            }
            else {
                dependencies.writeStdout('\x1b[H');
            }
            const config = await dependencies.readHudConfigFn(cwd);
            const ctx = await dependencies.readAllStateFn(cwd, config);
            const preset = flags.preset ?? config.preset;
            const line = dependencies.renderHudFn(ctx, preset, {
                maxWidth: process.stdout.columns ?? undefined,
                maxLines: HUD_TMUX_MAX_HEIGHT_LINES,
            });
            dependencies.writeStdout(line + '\x1b[K\n\x1b[J');
            await dependencies.runAuthorityTickFn({ cwd });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            dependencies.writeStderr(`HUD watch render failed: ${message}\n`);
            process.exitCode = 1;
            stop();
            return;
        }
        finally {
            inFlight = false;
        }
        if (queued) {
            queued = false;
            await renderTick();
        }
    };
    dependencies.registerSigint(stop);
    timer = dependencies.setIntervalFn(() => {
        void renderTick();
    }, 1000);
    await renderTick();
    if (!stopped) {
        await done;
    }
}
function parseHudPreset(value) {
    if (value === 'minimal' || value === 'focused' || value === 'full') {
        return value;
    }
    return undefined;
}
function parseFlags(args) {
    const flags = { watch: false, json: false, tmux: false };
    for (const arg of args) {
        if (arg === '--watch' || arg === '-w') {
            flags.watch = true;
        }
        else if (arg === '--json') {
            flags.json = true;
        }
        else if (arg === '--tmux') {
            flags.tmux = true;
        }
        else if (arg.startsWith('--preset=')) {
            const preset = parseHudPreset(arg.slice('--preset='.length));
            if (preset) {
                flags.preset = preset;
            }
        }
    }
    return flags;
}
async function renderOnce(cwd, flags) {
    const config = await readHudConfig(cwd);
    const ctx = await readAllState(cwd, config);
    const preset = flags.preset ?? config.preset;
    if (flags.json) {
        console.log(JSON.stringify(ctx, null, 2));
        return;
    }
    console.log(renderHud(ctx, preset, {
        maxWidth: process.stdout.columns ?? undefined,
        maxLines: HUD_TMUX_MAX_HEIGHT_LINES,
    }));
}
export async function hudCommand(args) {
    if (args[0] === '--help' || args[0] === '-h') {
        console.log(HUD_USAGE);
        return;
    }
    const flags = parseFlags(args);
    const cwd = process.cwd();
    if (flags.tmux) {
        await launchTmuxPane(cwd, flags);
        return;
    }
    if (!flags.watch) {
        await renderOnce(cwd, flags);
        return;
    }
    await runWatchMode(cwd, flags);
}
/** Shell-escape a string using single-quote wrapping (POSIX-safe). */
export function shellEscape(s) {
    return "'" + s.replace(/'/g, "'\\''") + "'";
}
/**
 * Build the argument array for `execFileSync('tmux', args)`.
 *
 * By returning an argv array instead of a shell command string, `cwd` is
 * passed as a literal argument to tmux (no shell expansion).  `omxBin` is
 * shell-escaped inside the command string that tmux will execute in a shell.
 */
export function buildTmuxSplitArgs(cwd, omxBin, preset, sessionId) {
    // Defense-in-depth: keep preset constrained even if this helper is reused.
    const safePreset = parseHudPreset(preset);
    const presetArg = safePreset ? ` --preset=${safePreset}` : '';
    const safeSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
    const sessionPrefix = safeSessionId ? `OMX_SESSION_ID=${shellEscape(safeSessionId)} ` : '';
    const cmd = `${sessionPrefix}node ${shellEscape(omxBin)} hud --watch${presetArg}`;
    return ['split-window', '-v', '-l', String(HUD_TMUX_HEIGHT_LINES), '-c', cwd, cmd];
}
async function launchTmuxPane(cwd, flags) {
    // Check if we're inside tmux
    if (!process.env.TMUX) {
        console.error('Not inside a tmux session. Start tmux first, then run: omx hud --tmux');
        process.exit(1);
    }
    const omxBin = resolveOmxCliEntryPath();
    if (!omxBin) {
        console.error('Failed to resolve OMX launcher path for tmux HUD startup.');
        process.exit(1);
    }
    const args = buildTmuxSplitArgs(cwd, omxBin, flags.preset, process.env.OMX_SESSION_ID);
    try {
        // Split bottom pane, 4 lines tall, running omx hud --watch.
        // execFileSync bypasses the shell – cwd and omxBin cannot inject commands.
        execFileSync('tmux', args, { stdio: 'inherit' });
        console.log('HUD launched in tmux pane below. Close with: Ctrl+C in that pane, or `tmux kill-pane -t bottom`');
    }
    catch {
        console.error('Failed to create tmux split. Ensure tmux is available.');
        process.exit(1);
    }
}
//# sourceMappingURL=index.js.map