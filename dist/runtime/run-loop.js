import { classifyRunOutcome, inferRunOutcome, inferTerminalLifecycleOutcome, isTerminalRunOutcome, } from './run-outcome.js';
function safeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
export async function runUntilTerminal(step, options = {}) {
    const history = [];
    const maxIterations = options.maxIterations ?? Number.POSITIVE_INFINITY;
    for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
        const raw = await step(iteration);
        const outcome = classifyRunOutcome(raw.outcome);
        const terminal = isTerminalRunOutcome(outcome);
        history.push(outcome);
        const normalized = {
            iteration,
            outcome,
            terminal,
            state: raw.state,
        };
        await options.onIteration?.(normalized);
        if (terminal) {
            return {
                iteration,
                outcome,
                state: raw.state,
                history,
            };
        }
    }
    throw new Error(`run loop exceeded maxIterations=${maxIterations} without reaching a terminal outcome`);
}
export function getRunContinuationSnapshot(candidate, options = {}) {
    if (!candidate || typeof candidate !== 'object')
        return null;
    const record = candidate;
    const outcome = inferRunOutcome(record);
    const lifecycleOutcome = inferTerminalLifecycleOutcome(record, {
        includeQuestionEnforcement: true,
    });
    const phase = safeString(candidate.current_phase) || options.phaseFallback || 'active';
    return {
        outcome,
        lifecycleOutcome,
        terminal: lifecycleOutcome !== undefined || isTerminalRunOutcome(outcome),
        phase,
    };
}
export function shouldContinueRun(candidate, options = {}) {
    const snapshot = getRunContinuationSnapshot(candidate, options);
    return snapshot !== null && !snapshot.terminal;
}
//# sourceMappingURL=run-loop.js.map