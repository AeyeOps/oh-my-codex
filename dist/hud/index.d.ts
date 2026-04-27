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
import type { HudFlags, HudPreset, HudRenderContext, ResolvedHudConfig } from './types.js';
export declare const HUD_USAGE: string;
type SleepFn = (ms: number, signal?: AbortSignal) => Promise<void>;
export declare function watchRenderLoop(render: () => Promise<void>, options?: {
    intervalMs?: number;
    signal?: AbortSignal;
    onError?: (error: unknown) => void;
    sleepFn?: SleepFn;
}): Promise<void>;
interface RunWatchModeDependencies {
    isTTY: boolean;
    env: NodeJS.ProcessEnv;
    readAllStateFn: (cwd: string, config?: ResolvedHudConfig) => Promise<HudRenderContext>;
    readHudConfigFn: (cwd: string) => Promise<ResolvedHudConfig>;
    renderHudFn: (ctx: HudRenderContext, preset: HudPreset, options?: {
        maxWidth?: number;
        maxLines?: number;
    }) => string;
    runAuthorityTickFn: (options: {
        cwd: string;
    }) => Promise<void>;
    writeStdout: (text: string) => void;
    writeStderr: (text: string) => void;
    registerSigint: (handler: () => void) => void;
    setIntervalFn: (handler: () => void, intervalMs: number) => ReturnType<typeof setInterval>;
    clearIntervalFn: (timer: ReturnType<typeof setInterval>) => void;
}
/**
 * Backward-compatible watch mode runner used by tests.
 */
export declare function runWatchMode(cwd: string, flags: HudFlags, deps?: Partial<RunWatchModeDependencies>): Promise<void>;
export declare function hudCommand(args: string[]): Promise<void>;
/** Shell-escape a string using single-quote wrapping (POSIX-safe). */
export declare function shellEscape(s: string): string;
/**
 * Build the argument array for `execFileSync('tmux', args)`.
 *
 * By returning an argv array instead of a shell command string, `cwd` is
 * passed as a literal argument to tmux (no shell expansion).  `omxBin` is
 * shell-escaped inside the command string that tmux will execute in a shell.
 */
export declare function buildTmuxSplitArgs(cwd: string, omxBin: string, preset?: string, sessionId?: string): string[];
export {};
//# sourceMappingURL=index.d.ts.map