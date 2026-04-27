export declare const SUBAGENT_TRACKING_SCHEMA_VERSION = 1;
export declare const DEFAULT_SUBAGENT_ACTIVE_WINDOW_MS = 120000;
export interface TrackedSubagentThread {
    thread_id: string;
    kind: 'leader' | 'subagent';
    first_seen_at: string;
    last_seen_at: string;
    last_turn_id?: string;
    turn_count: number;
    mode?: string;
}
export interface TrackedSubagentSession {
    session_id: string;
    leader_thread_id?: string;
    updated_at: string;
    threads: Record<string, TrackedSubagentThread>;
}
export interface SubagentTrackingState {
    schemaVersion: 1;
    sessions: Record<string, TrackedSubagentSession>;
}
export interface RecordSubagentTurnInput {
    sessionId: string;
    threadId: string;
    turnId?: string;
    timestamp?: string;
    mode?: string;
}
export interface SubagentSessionSummary {
    sessionId: string;
    leaderThreadId?: string;
    allThreadIds: string[];
    allSubagentThreadIds: string[];
    activeSubagentThreadIds: string[];
    updatedAt?: string;
}
export declare function subagentTrackingPath(cwd: string): string;
export declare function createSubagentTrackingState(): SubagentTrackingState;
export declare function normalizeSubagentTrackingState(input: unknown): SubagentTrackingState;
export declare function readSubagentTrackingState(cwd: string): Promise<SubagentTrackingState>;
export declare function writeSubagentTrackingState(cwd: string, state: SubagentTrackingState): Promise<string>;
export declare function recordSubagentTurn(state: SubagentTrackingState, input: RecordSubagentTurnInput): SubagentTrackingState;
export declare function recordSubagentTurnForSession(cwd: string, input: RecordSubagentTurnInput): Promise<SubagentTrackingState>;
export declare function summarizeSubagentSession(state: SubagentTrackingState, sessionId: string, options?: {
    now?: string | Date;
    activeWindowMs?: number;
}): SubagentSessionSummary | null;
export declare function readSubagentSessionSummary(cwd: string, sessionId: string, options?: {
    now?: string | Date;
    activeWindowMs?: number;
}): Promise<SubagentSessionSummary | null>;
//# sourceMappingURL=tracker.d.ts.map