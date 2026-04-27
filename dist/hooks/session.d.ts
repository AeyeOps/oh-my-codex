/**
 * Session Lifecycle Manager for oh-my-codex
 *
 * Tracks session start/end, detects stale sessions from crashed launches,
 * and provides structured logging for session events.
 */
export interface SessionState {
    session_id: string;
    native_session_id?: string;
    started_at: string;
    cwd: string;
    pid: number;
    platform?: NodeJS.Platform;
    pid_start_ticks?: number;
    pid_cmdline?: string;
}
/**
 * Reset session-scoped HUD/metrics files at launch so stale values do not leak
 * into a new Codex session.
 */
export declare function resetSessionMetrics(cwd: string, sessionId?: string): Promise<void>;
/**
 * Read current session state. Returns null if no session file exists.
 */
export declare function readSessionState(cwd: string): Promise<SessionState | null>;
export declare function isSessionStateAuthoritativeForCwd(state: SessionState, cwd: string): boolean;
export declare function isSessionStateUsable(state: SessionState, cwd: string, options?: SessionStaleCheckOptions): boolean;
export declare function readUsableSessionState(cwd: string, options?: SessionStaleCheckOptions): Promise<SessionState | null>;
interface LinuxProcessIdentity {
    startTicks: number;
    cmdline: string | null;
}
interface SessionStaleCheckOptions {
    platform?: NodeJS.Platform;
    isPidAlive?: (pid: number) => boolean;
    readLinuxIdentity?: (pid: number) => LinuxProcessIdentity | null;
}
interface SessionStartOptions {
    pid?: number;
    platform?: NodeJS.Platform;
    nativeSessionId?: string;
}
/**
 * Check if a session is stale.
 * - If the owning PID is dead, it is stale.
 * - On Linux, require process identity validation (start ticks, optional cmdline).
 *   If identity cannot be validated, treat the session as stale.
 */
export declare function isSessionStale(state: SessionState, options?: SessionStaleCheckOptions): boolean;
/**
 * Write session start state.
 */
export declare function writeSessionStart(cwd: string, sessionId: string, options?: SessionStartOptions): Promise<SessionState>;
/**
 * Reconcile a native/Codex SessionStart with the canonical OMX launch session.
 * If an authoritative current session already exists for this cwd/run, preserve
 * its OMX scope id and refresh PID/native metadata. Otherwise establish a fresh
 * canonical session using the native session id.
 */
export declare function reconcileNativeSessionStart(cwd: string, nativeSessionId: string, options?: SessionStartOptions): Promise<SessionState>;
/**
 * Write session end: archive to history, delete session.json.
 */
export declare function writeSessionEnd(cwd: string, sessionId: string): Promise<void>;
/**
 * Append a structured JSONL entry to the daily log file.
 */
export declare function appendToLog(cwd: string, entry: Record<string, unknown>): Promise<void>;
export {};
//# sourceMappingURL=session.d.ts.map