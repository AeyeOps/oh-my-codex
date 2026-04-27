export declare const DEFAULT_ALLOWED_MODES: string[];
export declare const DEFAULT_MARKER = "[OMX_TMUX_INJECT]";
export declare function normalizeTmuxHookConfig(raw: any): any;
export declare function tmuxHookExplicitlyDisablesInjection(raw: any): boolean;
export declare function pickActiveMode(activeModes: any, allowedModes: any): string | null;
export declare function buildDedupeKey({ threadId, turnId, mode, prompt }: any): string;
export declare function evaluateInjectionGuards({ config, mode, sourceText, assistantMessage, threadId, turnId, paneKey, sessionKey, skipQuotaChecks, now, state, }: any): any;
/**
 * Returns the tmux argv to query whether a pane is currently in copy-mode
 * (scrollback). The command prints "1" if the pane is in any mode, "0"
 * otherwise.
 */
export declare function buildPaneInModeArgv(paneTarget: any): string[];
/**
 * Returns the tmux argv to query the current foreground command of a pane.
 * Used to detect when the agent process has exited and the pane has returned
 * to a shell (zsh, bash, fish, etc.).
 */
export declare function buildPaneCurrentCommandArgv(paneTarget: any): string[];
/**
 * Returns true when the pane's foreground process is an interactive shell,
 * meaning the agent has exited and injection would land on a bare prompt.
 */
export declare function isPaneRunningShell(paneCurrentCommand: any): boolean;
/**
 * Canonical codex pane resolver. Finds the tmux pane running a codex/claude agent.
 *
 * Resolution order:
 * 1. TMUX_PANE env var — but only if the pane looks like a real agent pane, not HUD
 * 2. Scan all panes in the same tmux session for one started with codex
 * 3. Fail closed instead of guessing a shell or HUD pane
 *
 * All callers (auto-nudge, ralph steer, team dispatch, tmux injection) should
 * use this instead of raw `process.env.TMUX_PANE`.
 */
export declare function resolveCodexPane(): string;
export declare function normalizeTmuxCapture(value: any): string;
export declare function paneIsBootstrapping(capturedOrLines: any): boolean;
export declare function paneLooksReady(captured: any): boolean;
export declare function paneShowsCodexViewport(captured: any): boolean;
export declare function paneHasActiveTask(captured: any): boolean;
export declare function buildCapturePaneArgv(paneTarget: any, tailLines?: number): string[];
export declare function buildVisibleCapturePaneArgv(paneTarget: any): string[];
export declare function buildSendKeysArgv({ paneTarget, prompt, dryRun, submitKeyPresses }: any): any;
//# sourceMappingURL=tmux-hook-engine.d.ts.map