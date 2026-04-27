import { TERMINAL_LIFECYCLE_OUTCOMES, compatibilityRunOutcomeFromTerminalLifecycleOutcome, normalizeRunOutcome, normalizeTerminalLifecycleOutcome as normalizeTerminalLifecycleOutcomeContract, terminalLifecycleOutcomeFromRunOutcome, } from './run-outcome.js';
export { TERMINAL_LIFECYCLE_OUTCOMES, compatibilityRunOutcomeFromTerminalLifecycleOutcome, };
function rewriteWarning(warning) {
    return warning?.replace('legacy terminal lifecycle outcome', 'legacy lifecycle outcome');
}
function isCanonicalTerminalLifecycleOutcome(value) {
    return typeof value === 'string' && TERMINAL_LIFECYCLE_OUTCOMES.includes(value.trim());
}
export function normalizeTerminalLifecycleOutcome(value) {
    if (isCanonicalTerminalLifecycleOutcome(value)) {
        return { outcome: value.trim() };
    }
    const result = normalizeTerminalLifecycleOutcomeContract(value, {
        blockedOnUserStrategy: 'blocked',
    });
    return {
        ...(result.outcome ? { outcome: result.outcome } : {}),
        ...(result.warning ? { warning: rewriteWarning(result.warning) } : {}),
        ...(result.error ? { error: result.error } : {}),
    };
}
export function inferTerminalLifecycleOutcome(candidate) {
    const explicit = normalizeTerminalLifecycleOutcome(candidate.lifecycle_outcome);
    if (explicit.outcome || explicit.error)
        return explicit;
    const runOutcome = normalizeRunOutcome(candidate.run_outcome);
    if (runOutcome.error)
        return { error: runOutcome.error };
    switch (runOutcome.outcome) {
        case 'finish':
        case 'blocked_on_user':
        case 'failed':
            return {
                outcome: terminalLifecycleOutcomeFromRunOutcome(runOutcome.outcome, {
                    blockedOnUserStrategy: 'blocked',
                }),
            };
        case 'cancelled':
            return {
                outcome: terminalLifecycleOutcomeFromRunOutcome('cancelled', {
                    blockedOnUserStrategy: 'blocked',
                }),
                warning: 'normalized legacy run outcome "cancelled" -> "userinterlude"',
            };
        default:
            return {};
    }
}
export function preferredRunOutcomeForLifecycleOutcome(outcome) {
    return compatibilityRunOutcomeFromTerminalLifecycleOutcome(outcome);
}
//# sourceMappingURL=terminal-lifecycle.js.map