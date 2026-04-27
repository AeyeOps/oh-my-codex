/**
 * tmux Session Detection for Notifications
 *
 * Detects the current tmux session name and pane ID for inclusion in notification payloads.
 */
/**
 * Remove metadata-only tmux lines from alert-facing payload text while
 * preserving real runtime failures. Raw capture helpers remain unchanged.
 */
export declare function sanitizeTmuxAlertText(raw: string | null | undefined): string | undefined;
export interface TmuxPaneCaptureResult {
    content: string | null;
    live: boolean;
}
/**
 * Get the current tmux session name.
 * First checks $TMUX env, then falls back to finding the tmux session
 * that owns the current process tree (for hooks/subprocesses that don't
 * inherit $TMUX).
 */
export declare function getCurrentTmuxSession(): string | null;
/**
 * List active omx-team tmux sessions for a given team.
 */
export declare function getTeamTmuxSessions(teamName: string): string[];
/**
 * Capture the last N lines of output from a tmux pane.
 * Used to include a tail snippet in session-level notifications.
 * Returns null if capture fails or tmux is not available.
 */
export declare function captureTmuxPane(paneId?: string | null, lines?: number): string | null;
export declare function captureTmuxPaneWithLiveness(paneId?: string | null, lines?: number): TmuxPaneCaptureResult;
/**
 * Format tmux session info for human-readable display.
 * Returns null if not in tmux.
 */
export declare function formatTmuxInfo(): string | null;
/**
 * Get the current tmux pane ID (e.g., "%0").
 * Tries $TMUX_PANE env var first, then tmux display-message,
 * then falls back to PID-based detection.
 */
export declare function getCurrentTmuxPaneId(): string | null;
//# sourceMappingURL=tmux.d.ts.map