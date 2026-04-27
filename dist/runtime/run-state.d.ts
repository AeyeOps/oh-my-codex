import { type RunOutcome, type TerminalLifecycleOutcome } from './run-outcome.js';
export interface RunStateLike {
    active?: unknown;
    mode?: unknown;
    current_phase?: unknown;
    task_description?: unknown;
    started_at?: unknown;
    completed_at?: unknown;
    iteration?: unknown;
    max_iterations?: unknown;
    error?: unknown;
    outcome?: unknown;
    run_outcome?: unknown;
    lifecycle_outcome?: unknown;
    terminal_outcome?: unknown;
    question_enforcement?: unknown;
    owner_omx_session_id?: unknown;
    [key: string]: unknown;
}
export interface RunState {
    version: 1;
    mode: string;
    active: boolean;
    outcome: RunOutcome;
    lifecycle_outcome?: TerminalLifecycleOutcome;
    updated_at: string;
    current_phase?: string;
    task_description?: string;
    started_at?: string;
    completed_at?: string;
    iteration?: number;
    max_iterations?: number;
    error?: string;
    owner_omx_session_id?: string;
}
export declare function deriveRunOutcomeFromModeState(state: RunStateLike): RunOutcome;
export declare function buildRunState(state: RunStateLike, existing?: Partial<RunState> | null, nowIso?: string): RunState;
export declare function readRunState(workingDirectory?: string, explicitSessionId?: string): Promise<RunState | null>;
export declare function syncRunStateFromModeState(state: RunStateLike, workingDirectory?: string, explicitSessionId?: string): Promise<RunState>;
//# sourceMappingURL=run-state.d.ts.map