export declare const TERMINAL_RUN_OUTCOMES: readonly ["finish", "blocked_on_user", "failed", "cancelled"];
export declare const NON_TERMINAL_RUN_OUTCOMES: readonly ["progress", "continue"];
export declare const RUN_OUTCOMES: readonly ["progress", "continue", "finish", "blocked_on_user", "failed", "cancelled"];
export declare const TERMINAL_LIFECYCLE_OUTCOMES: readonly ["finished", "blocked", "failed", "userinterlude", "askuserQuestion"];
export type TerminalRunOutcome = (typeof TERMINAL_RUN_OUTCOMES)[number];
export type NonTerminalRunOutcome = (typeof NON_TERMINAL_RUN_OUTCOMES)[number];
export type RunOutcome = (typeof RUN_OUTCOMES)[number];
export type TerminalLifecycleOutcome = (typeof TERMINAL_LIFECYCLE_OUTCOMES)[number];
export interface RunOutcomeNormalizationResult {
    outcome?: RunOutcome;
    warning?: string;
    error?: string;
}
export interface TerminalLifecycleOutcomeNormalizationOptions {
    blockedOnUserStrategy?: 'blocked' | 'askuserQuestion' | 'userinterlude';
}
export interface TerminalLifecycleOutcomeNormalizationResult {
    outcome?: TerminalLifecycleOutcome;
    warning?: string;
    error?: string;
}
export interface RunOutcomeValidationResult {
    ok: boolean;
    state?: Record<string, unknown>;
    warning?: string;
    error?: string;
}
export declare function compatibilityRunOutcomeFromTerminalLifecycleOutcome(outcome: TerminalLifecycleOutcome): TerminalRunOutcome;
export declare function terminalLifecycleOutcomeFromRunOutcome(outcome: TerminalRunOutcome, options?: TerminalLifecycleOutcomeNormalizationOptions): TerminalLifecycleOutcome;
export declare function normalizeRunOutcome(value: unknown): RunOutcomeNormalizationResult;
export declare function normalizeTerminalLifecycleOutcome(value: unknown, options?: TerminalLifecycleOutcomeNormalizationOptions): TerminalLifecycleOutcomeNormalizationResult;
export declare function classifyRunOutcome(value: unknown): RunOutcome;
export declare function isTerminalRunOutcome(value: unknown): value is TerminalRunOutcome;
export declare function isTerminalLifecycleOutcome(value: unknown, options?: TerminalLifecycleOutcomeNormalizationOptions): value is TerminalLifecycleOutcome;
export declare function isNonTerminalRunOutcome(value: unknown): value is NonTerminalRunOutcome;
export declare function isNonTerminalRunState(value: unknown): boolean;
export declare function isTerminalRunState(value: unknown): boolean;
export declare function inferTerminalLifecycleOutcome(candidate: Record<string, unknown>, options?: {
    includeQuestionEnforcement?: boolean;
    blockedOnUserStrategy?: 'blocked' | 'askuserQuestion' | 'userinterlude';
}): TerminalLifecycleOutcome | undefined;
export declare function inferRunOutcome(candidate: Record<string, unknown>): RunOutcome;
export declare function applyRunOutcomeContract(candidate: Record<string, unknown>, options?: {
    nowIso?: string;
}): RunOutcomeValidationResult;
//# sourceMappingURL=run-outcome.d.ts.map