/**
 * Base mode lifecycle management for oh-my-codex
 * All execution modes (autopilot, autoresearch, deep-interview, ralph, ultrawork, team, ultraqa, ralplan) share this base.
 */
export interface ModeState {
    active: boolean;
    mode: string;
    iteration: number;
    max_iterations: number;
    current_phase: string;
    run_outcome?: string;
    task_description?: string;
    started_at: string;
    completed_at?: string;
    last_turn_at?: string;
    error?: string;
    [key: string]: unknown;
}
export type ModeName = 'autopilot' | 'autoresearch' | 'deep-interview' | 'ralph' | 'ultrawork' | 'team' | 'ultraqa' | 'ralplan';
/** @deprecated These mode names were removed in v4.6. Use the canonical modes instead. */
export type DeprecatedModeName = 'ultrapilot' | 'pipeline' | 'ecomode';
/**
 * Check if a mode name is deprecated and return a warning message if so.
 * Returns null if the mode is not deprecated.
 */
export declare function getDeprecationWarning(mode: string): string | null;
export declare function assertModeStartAllowed(mode: ModeName, projectRoot?: string): Promise<void>;
/**
 * Start a mode. Checks for exclusive mode conflicts.
 */
export declare function startMode(mode: ModeName, taskDescription: string, maxIterations?: number, projectRoot?: string): Promise<ModeState>;
/**
 * Read current mode state
 */
export declare function readModeState(mode: string, projectRoot?: string): Promise<ModeState | null>;
export declare function readModeStateForSession(mode: string, sessionId: string | undefined, projectRoot?: string): Promise<ModeState | null>;
/**
 * Update mode state (merge fields)
 */
export declare function updateModeState(mode: string, updates: Partial<ModeState>, projectRoot?: string, explicitSessionId?: string): Promise<ModeState>;
/**
 * Cancel a mode
 */
export declare function cancelMode(mode: string, projectRoot?: string): Promise<void>;
/**
 * Cancel all active modes
 */
export declare function cancelAllModes(projectRoot?: string): Promise<string[]>;
/**
 * List all active modes
 */
export declare function listActiveModes(projectRoot?: string): Promise<Array<{
    mode: string;
    state: ModeState;
}>>;
//# sourceMappingURL=base.d.ts.map