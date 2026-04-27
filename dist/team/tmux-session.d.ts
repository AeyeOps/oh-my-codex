import { spawnSync } from 'child_process';
import { normalizeTmuxCapture as sharedNormalizeTmuxCapture, paneHasActiveTask as sharedPaneHasActiveTask, paneIsBootstrapping as sharedPaneIsBootstrapping, paneLooksReady as sharedPaneLooksReady } from '../scripts/tmux-hook-engine.js';
export interface TeamSession {
    name: string;
    workerCount: number;
    cwd: string;
    workerPaneIds: string[];
    /** Leader's own pane ID — must never be targeted by worker cleanup routines. */
    leaderPaneId: string;
    /** HUD pane spawned below the leader column, or null if creation failed. */
    hudPaneId: string | null;
    /** Registered tmux resize hook name for the HUD pane, or null if unavailable. */
    resizeHookName: string | null;
    /** Registered tmux resize hook target in "<session>:<window>" form, or null. */
    resizeHookTarget: string | null;
}
export type TeamWorkerCli = 'codex' | 'claude' | 'gemini';
export type TeamWorkerLaunchMode = 'interactive' | 'prompt';
export interface WorkerSubmitPlan {
    shouldInterrupt: boolean;
    queueFirstRound: boolean;
    rounds: number;
    submitKeyPressesPerRound: number;
    allowAdaptiveRetry: boolean;
}
export interface WorkerProcessLaunchSpec {
    workerCli: TeamWorkerCli;
    command: string;
    args: string[];
    env: Record<string, string>;
}
interface TmuxPaneInfo {
    paneId: string;
    currentCommand: string;
    startCommand: string;
}
type SpawnSyncLike = typeof spawnSync;
export declare function mitigateCopyModeUnderlineArtifacts(sessionTarget: string): boolean;
export declare function hasCurrentTmuxClientContext(): boolean;
export declare function isMsysOrGitBash(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): boolean;
export declare function translatePathForMsys(value: string, env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform, spawnImpl?: SpawnSyncLike): string;
export declare function listPaneIds(target: string): string[];
export declare function chooseTeamLeaderPaneId(panes: TmuxPaneInfo[], preferredPaneId: string): string;
export declare function sleepFractionalSeconds(seconds: number, sleepImpl?: (ms: number) => void): void;
export declare function buildResizeHookTarget(sessionName: string, windowIndex: string): string;
export declare function buildResizeHookName(teamName: string, sessionName: string, windowIndex: string, hudPaneId: string): string;
export declare function buildHudPaneTarget(hudPaneId: string): string;
export declare function buildRegisterResizeHookArgs(hookTarget: string, hookName: string, hudPaneId: string, heightLines?: number): string[];
export declare function buildUnregisterResizeHookArgs(hookTarget: string, hookName: string): string[];
export declare function buildClientAttachedReconcileHookName(teamName: string, sessionName: string, windowIndex: string, hudPaneId: string): string;
export declare function buildRegisterClientAttachedReconcileArgs(hookTarget: string, hookName: string, hudPaneId: string, heightLines?: number): string[];
export declare function buildUnregisterClientAttachedReconcileArgs(hookTarget: string, hookName: string): string[];
export declare function unregisterResizeHook(hookTarget: string, hookName: string): boolean;
export declare function buildScheduleDelayedHudResizeArgs(hudPaneId: string, delaySeconds?: number, heightLines?: number): string[];
export declare function buildReconcileHudResizeArgs(hudPaneId: string, heightLines?: number): string[];
export declare function resolveTeamWorkerLaunchMode(env?: NodeJS.ProcessEnv): TeamWorkerLaunchMode;
export declare function resolveTeamWorkerCli(launchArgs?: string[], env?: NodeJS.ProcessEnv): TeamWorkerCli;
export declare function resolveTeamWorkerCliPlan(workerCount: number, launchArgs?: string[], env?: NodeJS.ProcessEnv): TeamWorkerCli[];
export declare function translateWorkerLaunchArgsForCli(workerCli: TeamWorkerCli, args: string[], initialPrompt?: string, workerRole?: string): string[];
export declare function assertTeamWorkerCliBinaryAvailable(workerCli: TeamWorkerCli, existsImpl?: (binary: string) => boolean): void;
export declare function buildWorkerStartupCommand(teamName: string, workerIndex: number, launchArgs?: string[], cwd?: string, extraEnv?: Record<string, string>, workerCliOverride?: TeamWorkerCli, initialPrompt?: string, workerRole?: string): string;
export declare function buildWorkerProcessLaunchSpec(teamName: string, workerIndex: number, launchArgs?: string[], cwd?: string, extraEnv?: Record<string, string>, workerCliOverride?: TeamWorkerCli, initialPrompt?: string, workerRole?: string): WorkerProcessLaunchSpec;
export declare function sanitizeTeamName(name: string): string;
/**
 * Detect whether the process is running inside a WSL2 environment.
 * WSL2 always sets WSL_DISTRO_NAME; WSL_INTEROP is also present.
 * Fallback: check /proc/version for the Microsoft kernel string.
 */
export declare function isWsl2(): boolean;
/**
 * Detect whether the process is running on native Windows (not WSL2).
 * OMX requires tmux, which is unavailable on native Windows.
 */
export declare function isNativeWindows(): boolean;
export declare function isTmuxAvailable(): boolean;
export declare function createTeamSession(teamName: string, workerCount: number, cwd: string, workerLaunchArgs?: string[], workerStartups?: Array<{
    cwd?: string;
    env?: Record<string, string>;
    initialPrompt?: string;
    launchArgs?: string[];
    workerCli?: TeamWorkerCli;
    workerRole?: string;
}>): TeamSession;
export declare function restoreStandaloneHudPane(leaderPaneId: string | null | undefined, cwd: string): string | null;
/**
 * Enable tmux mouse mode for a session so users can scroll pane content
 * (e.g. long agent output) with the mouse wheel instead of arrow keys.
 *
 * This helper is intentionally limited to session-scoped options so OMX
 * does not overwrite server-global tmux bindings/options owned by users,
 * oh-my-tmux, or other sessions. Returns true if the session mouse option
 * was set successfully, false otherwise.
 */
export declare function enableMouseScrolling(sessionTarget: string): boolean;
export declare const paneIsBootstrapping: typeof sharedPaneIsBootstrapping;
export declare const paneLooksReady: typeof sharedPaneLooksReady;
export declare const paneHasActiveTask: typeof sharedPaneHasActiveTask;
/**
 * Worker CLI resolution contract for submit routing:
 * 1) explicit workerCli param from caller
 * 2) per-worker OMX_TEAM_WORKER_CLI_MAP entry (worker index aware)
 * 3) global/default OMX_TEAM_WORKER_CLI behavior
 */
export declare function resolveWorkerCliForSend(workerIndex: number, workerCli?: TeamWorkerCli, launchArgs?: string[], env?: NodeJS.ProcessEnv): TeamWorkerCli;
export declare function buildWorkerSubmitPlan(strategy: 'auto' | 'queue' | 'interrupt', workerCli: TeamWorkerCli, paneBusyAtStart: boolean, allowAdaptiveRetry: boolean): WorkerSubmitPlan;
export declare function shouldAttemptAdaptiveRetry(strategy: 'auto' | 'queue' | 'interrupt', paneBusyAtStart: boolean, allowAdaptiveRetry: boolean, latestCapture: string | null, text: string): boolean;
export declare function waitForWorkerReady(sessionName: string, workerIndex: number, timeoutMs?: number, workerPaneId?: string): boolean;
export declare function waitForWorkerReadyAsync(sessionName: string, workerIndex: number, timeoutMs?: number, workerPaneId?: string): Promise<boolean>;
/**
 * Detect and auto-dismiss a Codex "Trust this directory?" prompt in a worker pane.
 * Returns true if a trust prompt was found and dismissed, false otherwise.
 * Opt-out: set OMX_TEAM_AUTO_TRUST=0 to disable auto-dismissal.
 */
export declare function dismissTrustPromptIfPresent(sessionName: string, workerIndex: number, workerPaneId?: string): boolean;
export declare const normalizeTmuxCapture: typeof sharedNormalizeTmuxCapture;
export declare function sendToWorkerStdin(stdin: Pick<NodeJS.WritableStream, 'write' | 'writable'> | null | undefined, text: string): void;
export declare function sendToWorker(sessionName: string, workerIndex: number, text: string, workerPaneId?: string, workerCli?: TeamWorkerCli): Promise<void>;
export declare function notifyLeaderStatus(sessionName: string, message: string): boolean;
export declare function getWorkerPanePid(sessionName: string, workerIndex: number, workerPaneId?: string): number | null;
export declare function isWorkerAlive(sessionName: string, workerIndex: number, workerPaneId?: string): boolean;
export declare function isWorkerPaneOpen(sessionName: string, workerIndex: number, workerPaneId?: string): boolean;
export declare function killWorker(sessionName: string, workerIndex: number, workerPaneId?: string, leaderPaneId?: string): Promise<void>;
export declare function killWorkerByPaneId(workerPaneId: string, leaderPaneId?: string): void;
export declare function killWorkerByPaneIdAsync(workerPaneId: string, leaderPaneId?: string): Promise<void>;
export interface PaneTeardownSummary {
    attemptedPaneIds: string[];
    excluded: {
        leader: number;
        hud: number;
        invalid: number;
    };
    kill: {
        attempted: number;
        succeeded: number;
        failed: number;
    };
}
export interface PaneTeardownOptions {
    leaderPaneId?: string | null;
    hudPaneId?: string | null;
    graceMs?: number;
}
export interface SharedSessionShutdownTopology {
    livePaneIds: string[];
    leaderPaneId: string | null;
    hudPaneIds: string[];
}
export declare function resolveSharedSessionShutdownTopology(sessionName: string, preferredLeaderPaneId?: string | null): SharedSessionShutdownTopology;
/**
 * Shared pane-id-direct teardown primitive for worker pane cleanup.
 * Must remain liveness-agnostic: do not gate on isWorkerAlive/killWorker.
 */
export declare function teardownWorkerPanes(paneIds: string[], options?: PaneTeardownOptions): Promise<PaneTeardownSummary>;
export declare function killWorkerPanes(paneIds: string[], leaderPaneId: string, graceMs?: number, hudPaneId?: string): Promise<PaneTeardownSummary>;
export declare function destroyTeamSession(sessionName: string): void;
export declare function listTeamSessions(): string[];
/**
 * Notify the leader through durable mailbox state only.
 *
 * Team leaders are a coordination endpoint, not a direct tmux control target:
 * workers and runtime paths may message `leader-fixed` via `omx team api`
 * / mailbox persistence, but team code must not inject text or control keys
 * into the leader pane. This is the async mailbox-based replacement for
 * `notifyLeaderStatus()`.
 */
export declare function notifyLeaderMailboxAsync(teamName: string, fromWorker: string, message: string, cwd: string): Promise<boolean>;
export {};
//# sourceMappingURL=tmux-session.d.ts.map