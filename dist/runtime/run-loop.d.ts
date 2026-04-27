import { type RunOutcome, type TerminalLifecycleOutcome, type TerminalRunOutcome } from './run-outcome.js';
export interface RunLoopIteration<TState> {
    outcome: unknown;
    state: TState;
}
export interface NormalizedRunLoopIteration<TState> {
    iteration: number;
    outcome: RunOutcome;
    terminal: boolean;
    state: TState;
}
export interface RunLoopTerminalResult<TState> {
    iteration: number;
    outcome: TerminalRunOutcome;
    state: TState;
    history: RunOutcome[];
}
export interface RunUntilTerminalOptions<TState> {
    maxIterations?: number;
    onIteration?: (result: NormalizedRunLoopIteration<TState>) => Promise<void> | void;
}
export interface RunContinuationStateLike {
    current_phase?: unknown;
    run_outcome?: unknown;
    lifecycle_outcome?: unknown;
    terminal_outcome?: unknown;
    question_enforcement?: unknown;
    active?: unknown;
    completed_at?: unknown;
    [key: string]: unknown;
}
export interface RunContinuationSnapshot {
    outcome: RunOutcome;
    lifecycleOutcome?: TerminalLifecycleOutcome;
    terminal: boolean;
    phase: string;
}
export declare function runUntilTerminal<TState>(step: (iteration: number) => Promise<RunLoopIteration<TState>>, options?: RunUntilTerminalOptions<TState>): Promise<RunLoopTerminalResult<TState>>;
export declare function getRunContinuationSnapshot(candidate: RunContinuationStateLike | null | undefined, options?: {
    phaseFallback?: string;
}): RunContinuationSnapshot | null;
export declare function shouldContinueRun(candidate: RunContinuationStateLike | null | undefined, options?: {
    phaseFallback?: string;
}): boolean;
//# sourceMappingURL=run-loop.d.ts.map