/**
 * tmux Pane Interaction Utilities for Reply Listener
 *
 * Provides functions to capture pane content, analyze whether a pane is running
 * Codex CLI, and inject text into panes. Used by the reply-listener daemon.
 */
export declare function isTmuxAvailable(): boolean;
/**
 * Builds the argv array for `tmux capture-pane`.
 * Keeping args separate (never interpolated into a shell string) prevents
 * command injection through a malicious paneId value (issue #156).
 */
export declare function buildCapturePaneArgv(paneId: string, lines: number): string[];
export declare function capturePaneContent(paneId: string, lines?: number): string;
export interface PaneAnalysis {
    hasCodex: boolean;
    hasRateLimitMessage: boolean;
    isBlocked: boolean;
    confidence: number;
}
export declare function analyzePaneContent(content: string): PaneAnalysis;
/**
 * Builds the ordered list of tmux send-keys argv arrays needed to type text
 * into a pane and optionally submit it.
 *
 * C-m (carriage return) is always sent in its own dedicated send-keys call, never
 * bundled with the text payload. This prevents newline/submit injection: without
 * this isolation a C-m (or any other tmux key name) embedded in the text
 * could be interpreted as a key press by tmux when sent without -l (issue #107).
 *
 * @param paneId     tmux pane identifier, e.g. "%3"
 * @param text       text to type; embedded newlines are replaced with spaces
 *                   to prevent them from acting as submit keypresses when sent literally
 * @param pressEnter when true, appends two isolated C-m submit calls
 * @returns          array of argv arrays, one per send-keys invocation
 */
export declare function buildSendPaneArgvs(paneId: string, text: string, pressEnter?: boolean): string[][];
/**
 * Returns the number of C-m (submit) key presses needed for a given worker CLI.
 * Source of truth: Rust runtime's submit_presses_for_worker_cli (Claude=1, Codex/Other=2).
 * Mirrors the Rust logic inline to avoid shelling out for a trivial mapping.
 */
export declare function getSubmitPresses(workerCli: string): number;
type SpawnSyncImpl = (command: string, args: ReadonlyArray<string>, options?: {
    timeout?: number;
    stdio?: ['pipe', 'pipe', 'pipe'];
    encoding?: 'utf-8';
    windowsHide?: boolean;
}) => {
    error?: Error;
    status: number | null;
};
interface SendToPaneDeps {
    spawnSyncImpl?: SpawnSyncImpl;
    sleepImpl?: (ms: number) => void;
}
export declare function sendToPane(paneId: string, text: string, pressEnter?: boolean, deps?: SendToPaneDeps): boolean;
export {};
//# sourceMappingURL=tmux-detector.d.ts.map