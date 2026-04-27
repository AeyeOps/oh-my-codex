/**
 * oh-my-codex CLI
 * Multi-agent orchestration for OpenAI Codex CLI
 */
import { type SetupInstallMode, type SetupScope } from "./setup.js";
import { type CleanupDependencies, type CleanupResult } from "./cleanup.js";
export { readPersistedSetupPreferences, readPersistedSetupScope, resolveCodexConfigPathForLaunch, resolveCodexHomeForLaunch, } from "./codex-home.js";
export { parseTmuxPaneSnapshot, isHudWatchPane, findHudWatchPaneIds } from "../hud/tmux.js";
import { type NotifyTempContract, type ParseNotifyTempContractResult } from "../notifications/temp-contract.js";
export declare function resolveNotifyFallbackWatcherScript(pkgRoot?: string): string;
export declare function resolveHookDerivedWatcherScript(pkgRoot?: string): string;
export declare function resolveNotifyHookScript(pkgRoot?: string): string;
export declare const HELP = "\noh-my-codex (omx) - Multi-agent orchestration for Codex CLI\n\nUsage:\n  omx           Launch Codex CLI (HUD auto-attaches only when already inside tmux)\n  omx exec      Run codex exec non-interactively with OMX AGENTS/overlay injection\n  omx setup     Install skills, prompts, MCP servers, and scope-specific AGENTS.md\n                (user scope prompts for legacy vs plugin skill delivery when needed)\n  omx update    Show fork-managed update commands; public npm auto-update is disabled\n  omx uninstall Remove OMX configuration and clean up installed artifacts\n  omx doctor    Check installation health\n  omx list      List packaged OMX skills and native agent prompts (--json)\n  omx cleanup   Kill orphaned OMX MCP server processes and remove stale OMX /tmp directories\n  omx doctor --team  Check team/swarm runtime health diagnostics\n  omx ask       Ask local provider CLI (claude|gemini) and write artifact output\n  omx question  OMX-owned blocking question UI entrypoint for agent-invoked user questions\n  omx adapt     Scaffold OMX-owned adapter foundations for persistent external targets\n  omx resume    Resume a previous interactive Codex session\n  omx explore   Default read-only exploration entrypoint (may adaptively use sparkshell backend)\n  omx session   Search prior local session transcripts and history artifacts\n  omx agents-init [path]\n                Bootstrap lightweight AGENTS.md files for a repo/subtree\n  omx agents    Manage Codex native agent TOML files\n  omx deepinit [path]\n                Alias for agents-init (lightweight AGENTS bootstrap only)\n  omx team      Spawn parallel worker panes in tmux and bootstrap inbox/task state\n  omx ralph     Launch Codex with ralph persistence mode active\n  omx autoresearch [DEPRECATED] Use $autoresearch; direct CLI launch removed\n  omx version   Show version information\n  omx tmux-hook Manage tmux prompt injection workaround (init|status|validate|test)\n  omx hooks     Manage hook plugins (init|status|validate|test)\n  omx hud       Show HUD statusline (--watch, --json, --preset=NAME)\n  omx state     Read/write/list OMX mode state via CLI parity surface\n  omx notepad   CLI parity for OMX notepad MCP tools\n  omx project-memory\n                CLI parity for OMX project-memory MCP tools\n  omx trace     CLI parity for OMX trace MCP tools\n  omx code-intel\n                CLI parity for OMX code-intel MCP tools\n  omx wiki      CLI parity for OMX wiki MCP tools\n  omx mcp-serve Launch an OMX stdio MCP server target (plugin/runtime use)\n  omx sparkshell <command> [args...]\n  omx sparkshell --tmux-pane <pane-id> [--tail-lines <100-1000>]\n                Run native sparkshell sidecar for direct command execution or explicit tmux-pane summarization\n                (also used as an adaptive backend for qualifying read-only explore tasks)\n  omx help      Show this help message\n  omx status    Show active modes and state\n  omx cancel    Cancel active execution modes\n  omx reasoning Show or set model reasoning effort (low|medium|high|xhigh)\n\nOptions:\n  --yolo        Launch Codex in yolo mode (shorthand for: omx launch --yolo)\n  --high        Launch Codex with high reasoning effort\n                (shorthand for: -c model_reasoning_effort=\"high\")\n  --xhigh       Launch Codex with xhigh reasoning effort\n                (shorthand for: -c model_reasoning_effort=\"xhigh\")\n  --madmax      DANGEROUS: bypass Codex approvals and sandbox\n                (alias for --dangerously-bypass-approvals-and-sandbox)\n  --spark       Use the Codex spark model (~1.3x faster) for team workers only\n                Workers get the configured low-complexity team model; leader model unchanged\n  --madmax-spark  spark model for workers + bypass approvals for leader and workers\n                (shorthand for: --spark --madmax)\n  --notify-temp  Enable temporary notification routing for this run/session only\n  --tmux         Launch the interactive leader session in detached tmux\n  --discord      Select Discord provider for temporary notification mode\n  --slack        Select Slack provider for temporary notification mode\n  --telegram     Select Telegram provider for temporary notification mode\n  --custom <name>\n                Select custom/OpenClaw gateway name for temporary notification mode\n  -w, --worktree[=<name>]\n                Launch Codex in a git worktree (detached when no name is given)\n  --force       Force reinstall (overwrite existing files)\n  --dry-run     Show what would be done without doing it\n  --plugin      Use Codex plugin delivery for omx setup and remove legacy OMX-managed user/project components\n  --keep-config Skip config.toml cleanup during uninstall\n  --purge       Remove .omx/ cache directory during uninstall\n  --verbose     Show detailed output\n  --scope       Setup scope for \"omx setup\" only:\n                user | project\n";
type CliCommand = "launch" | "exec" | "setup" | "update" | "list" | "agents" | "agents-init" | "deepinit" | "uninstall" | "doctor" | "cleanup" | "ask" | "question" | "adapt" | "explore" | "sparkshell" | "team" | "session" | "resume" | "version" | "tmux-hook" | "hooks" | "hud" | "state" | "wiki" | "mcp-serve" | "status" | "cancel" | "help" | "reasoning" | string;
export interface ResolvedCliInvocation {
    command: CliCommand;
    launchArgs: string[];
}
export declare function resolveSetupInstallModeArg(args: string[]): SetupInstallMode | undefined;
export declare function resolveSetupScopeArg(args: string[]): SetupScope | undefined;
export declare function resolveCliInvocation(args: string[]): ResolvedCliInvocation;
export declare function resolveNotifyTempContract(args: string[], env?: NodeJS.ProcessEnv): ParseNotifyTempContractResult;
export declare function commandOwnsLocalHelp(command: CliCommand): boolean;
export type CodexLaunchPolicy = "inside-tmux" | "detached-tmux" | "direct";
export declare function resolveLeaderLaunchPolicyOverride(args: string[]): CodexLaunchPolicy | undefined;
export declare function resolveCodexLaunchPolicy(env?: NodeJS.ProcessEnv, _platform?: NodeJS.Platform, tmuxAvailable?: boolean, nativeWindows?: boolean, stdinIsTTY?: boolean, stdoutIsTTY?: boolean, explicitPolicy?: CodexLaunchPolicy): CodexLaunchPolicy;
export interface TmuxLaunchHealth {
    usable: boolean;
    reason?: string;
}
export declare function checkDetachedTmuxLaunchHealth(): TmuxLaunchHealth;
export interface CodexExecFailureClassification {
    kind: "exit" | "launch-error";
    code?: string;
    message: string;
    exitCode?: number;
    signal?: NodeJS.Signals;
}
export declare function resolveSignalExitCode(signal: NodeJS.Signals | null | undefined): number;
export declare function classifyCodexExecFailure(error: unknown): CodexExecFailureClassification;
export interface DetachedSessionTmuxStep {
    name: string;
    args: string[];
}
export declare function buildHudPaneCleanupTargets(existingPaneIds: string[], createdPaneId: string | null, leaderPaneId?: string): string[];
export declare function main(args: string[]): Promise<void>;
export declare function launchWithHud(args: string[]): Promise<void>;
export declare function execWithOverlay(args: string[]): Promise<void>;
export declare function normalizeCodexLaunchArgs(args: string[]): string[];
/**
 * Returns the spark model string if --spark or --madmax-spark appears in the
 * raw (pre-normalize) args, or undefined if neither flag is present.
 * Used to route the spark model to team workers without affecting the leader.
 */
export declare function resolveWorkerSparkModel(args: string[], codexHomeOverride?: string): string | undefined;
export declare function resolveNativeSessionName(cwd: string, sessionId: string, env?: NodeJS.ProcessEnv): string;
export declare function injectModelInstructionsBypassArgs(cwd: string, args: string[], env?: NodeJS.ProcessEnv, defaultFilePath?: string): string[];
export declare function collectInheritableTeamWorkerArgs(codexArgs: string[]): string[];
export declare function resolveTeamWorkerLaunchArgsEnv(existingRaw: string | undefined, codexArgs: string[], inheritLeaderFlags?: boolean, defaultModel?: string): string | null;
export declare function readTopLevelTomlString(content: string, key: string): string | null;
export declare function upsertTopLevelTomlString(content: string, key: string, value: string): string;
export declare function buildTmuxSessionName(cwd: string, sessionId: string): string;
export declare function buildDetachedTmuxSessionName(cwd: string, sessionId: string): string;
export declare function detectDetachedSessionWindowIndex(sessionName: string): string | null;
type TmuxExecSync = (file: string, args: readonly string[]) => string;
export declare function acquireTmuxExtendedKeysLease(cwd: string, execFileSyncImpl?: TmuxExecSync, ownerPid?: number): string | null;
export declare function releaseTmuxExtendedKeysLease(cwd: string, leaseHandle: string, execFileSyncImpl?: TmuxExecSync): void;
export declare function withTmuxExtendedKeys<T>(cwd: string, run: () => T, execFileSyncImpl?: TmuxExecSync): T;
export declare function buildDetachedSessionBootstrapSteps(sessionName: string, cwd: string, codexCmd: string, hudCmd: string, workerLaunchArgs: string | null, codexHomeOverride?: string, notifyTempContractRaw?: string | null, nativeWindows?: boolean, sessionId?: string): DetachedSessionTmuxStep[];
export declare function buildDetachedSessionFinalizeSteps(sessionName: string, hudPaneId: string | null, hookWindowIndex: string | null, enableMouse: boolean, nativeWindows?: boolean): DetachedSessionTmuxStep[];
export declare function buildDetachedSessionRollbackSteps(sessionName: string, hookTarget: string | null, hookName: string | null, clientAttachedHookName: string | null): DetachedSessionTmuxStep[];
export declare function buildNotifyTempStartupMessages(contract: NotifyTempContract, hasValidProviders: boolean): {
    infoLines: string[];
    warningLines: string[];
};
export declare function buildNotifyFallbackWatcherEnv(env?: NodeJS.ProcessEnv, options?: {
    codexHomeOverride?: string;
    enableAuthority?: boolean;
    sessionId?: string;
}): NodeJS.ProcessEnv;
export declare function shouldEnableNotifyFallbackWatcher(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): boolean;
export declare function cleanupLaunchOrphanedMcpProcesses(dependencies?: CleanupDependencies): Promise<CleanupResult>;
interface PostLaunchCleanupDependencies {
    cleanup?: () => Promise<CleanupResult>;
    writeInfo?: (line: string) => void;
    writeWarn?: (line: string) => void;
    writeError?: (line: string) => void;
}
interface PostLaunchModeCleanupDependencies {
    readdir?: typeof import("fs/promises").readdir;
    readFile?: typeof import("fs/promises").readFile;
    writeFile?: typeof import("fs/promises").writeFile;
    sleep?: (ms: number) => Promise<void>;
    writeWarn?: (line: string) => void;
    now?: () => Date;
}
export declare function cleanupPostLaunchModeStateFiles(cwd: string, sessionId: string, dependencies?: PostLaunchModeCleanupDependencies): Promise<void>;
export declare function reapPostLaunchOrphanedMcpProcesses(dependencies?: PostLaunchCleanupDependencies): Promise<void>;
export declare function buildTmuxShellCommand(command: string, args: string[]): string;
export declare function buildWindowsPromptCommand(command: string, args: string[]): string;
/**
 * Wrap a command for tmux pane execution while preserving the tmux pane cwd.
 * tmux already starts the pane at `-c <cwd>`; using a login shell here can
 * reset that cwd back to the shell's startup directory on some setups.
 * Source zsh/bash rc files explicitly when needed, then exec the target.
 */
export declare function buildTmuxPaneCommand(command: string, args: string[], shellPath?: string | undefined): string;
export declare function buildDetachedWindowsBootstrapScript(sessionName: string, commandText: string, delayMs?: number, tmuxCommand?: string): string;
export declare function shouldDetachBackgroundHelper(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): boolean;
export type BackgroundHelperLaunchMode = "direct-detached" | "windows-msys-bootstrap";
export declare function resolveBackgroundHelperLaunchMode(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): BackgroundHelperLaunchMode;
export declare function buildWindowsMsysBackgroundHelperBootstrapScript(helperArgs: readonly string[], cwd: string): string;
export declare function reapStaleNotifyFallbackWatcher(pidPath: string, deps?: {
    exists?: (path: string) => boolean;
    readFile?: (path: string, encoding: BufferEncoding) => Promise<string>;
    tryKillPid?: (pid: number, signal?: NodeJS.Signals) => boolean;
    hasErrnoCode?: (error: unknown, code: string) => boolean;
    warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
    isWatcherProcess?: (pid: number) => boolean;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map