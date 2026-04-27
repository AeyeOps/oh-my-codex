import { TERMINAL_LIFECYCLE_OUTCOMES, compatibilityRunOutcomeFromTerminalLifecycleOutcome, type RunOutcome, type TerminalLifecycleOutcome, type TerminalLifecycleOutcomeNormalizationResult } from './run-outcome.js';
export { TERMINAL_LIFECYCLE_OUTCOMES, compatibilityRunOutcomeFromTerminalLifecycleOutcome, };
export type { TerminalLifecycleOutcome };
export type TerminalLifecycleNormalizationResult = TerminalLifecycleOutcomeNormalizationResult;
export declare function normalizeTerminalLifecycleOutcome(value: unknown): TerminalLifecycleNormalizationResult;
export declare function inferTerminalLifecycleOutcome(candidate: {
    lifecycle_outcome?: unknown;
    run_outcome?: unknown;
}): TerminalLifecycleNormalizationResult;
export declare function preferredRunOutcomeForLifecycleOutcome(outcome: TerminalLifecycleOutcome): RunOutcome;
//# sourceMappingURL=terminal-lifecycle.d.ts.map